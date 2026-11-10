using System.Diagnostics;
using System.Text.Json;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.ConfigureKestrel(options => options.Limits.MaxRequestBodySize = 24000);
builder.WebHost.UseUrls("http://0.0.0.0:8080");
var app = builder.Build();
var token = Environment.GetEnvironmentVariable("CODEDUO_COMPILER_TOKEN");
if (string.IsNullOrWhiteSpace(token) || token.Length < 32) throw new InvalidOperationException("CODEDUO_COMPILER_TOKEN must be configured (32+ characters).");
var slots = new SemaphoreSlim(2, 2);
app.MapPost("/compile", async (HttpContext ctx) =>
{
    if (!System.Security.Cryptography.CryptographicOperations.FixedTimeEquals(
            System.Text.Encoding.UTF8.GetBytes(ctx.Request.Headers.Authorization.ToString()),
            System.Text.Encoding.UTF8.GetBytes("Bearer " + token)))
        return Results.Json(new { error = "Unauthorized" }, statusCode: 401);
    if (ctx.Request.ContentLength > 24000) return Results.Json(new { error = "Code too large" }, statusCode: 413);
    using var readCts = new CancellationTokenSource(TimeSpan.FromSeconds(4));
    string? code;
    try {
        var json = await JsonSerializer.DeserializeAsync<CompileRequest>(ctx.Request.Body,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }, readCts.Token);
        code = json?.Code;
    } catch { return Results.Json(new { error = "Invalid JSON" }, statusCode: 400); }
    if (code == null || code.Length > 16000)
        return Results.Json(new { error = "C# source must have at most 16000 characters" }, statusCode: 400);
    if (!await slots.WaitAsync(TimeSpan.FromSeconds(2)))
        return Results.Json(new { error = "Compiler is busy" }, statusCode: 429);
    var folder = Path.Combine(Path.GetTempPath(), "codeduo-"+Guid.NewGuid().ToString("N"));
    Directory.CreateDirectory(folder);
    try {
        await File.WriteAllTextAsync(Path.Combine(folder,"Program.cs"), code);
        await File.WriteAllTextAsync(Path.Combine(folder,"Program.csproj"),
            "<Project Sdk=\"Microsoft.NET.Sdk\"><PropertyGroup><OutputType>Exe</OutputType><TargetFramework>net8.0</TargetFramework><ImplicitUsings>enable</ImplicitUsings><Nullable>enable</Nullable><TreatWarningsAsErrors>false</TreatWarningsAsErrors><EnableDefaultCompileItems>false</EnableDefaultCompileItems><GenerateAssemblyInfo>false</GenerateAssemblyInfo><UseSharedCompilation>false</UseSharedCompilation></PropertyGroup><ItemGroup><Compile Include=\"Program.cs\" /></ItemGroup></Project>");
        await File.WriteAllTextAsync(Path.Combine(folder,"NuGet.Config"),
            "<configuration><packageSources><clear/></packageSources></configuration>");
        using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(12));
        var output = await Execute("dotnet", "build Program.csproj --nologo --verbosity quiet --disable-build-servers --property:NuGetAudit=false", folder, timeout.Token);
        // The student assembly is NEVER executed by this service.
        var lines = output.Text.Replace(folder,"[projet]").Split('\n',
            StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(line => line.Contains(": error ") || line.Contains(": warning "))
            .Take(30).Select(line => line.Length>450?line[..450]:line).ToArray();
        return Results.Json(new { ok = output.ExitCode == 0, diagnostics = lines, toolchain = "dotnet-sdk-8", executed = false });
    } catch (OperationCanceledException) {
        return Results.Json(new { error = "Compilation timed out" }, statusCode: 408);
    } catch(Exception ex) {
        app.Logger.LogWarning(ex,"Compilation failed internally");
        return Results.Json(new { error = "Compiler unavailable" }, statusCode: 503);
    } finally {
        try { Directory.Delete(folder, recursive: true); } catch {}
        slots.Release();
    }
});
app.MapGet("/health",() => Results.Json(new { ok = true, compiler = "dotnet-sdk-8", execution = false }));
await app.RunAsync();

static async Task<(int ExitCode,string Text)> Execute(string program,string args,string cwd,CancellationToken cancellation) {
    var start = new ProcessStartInfo(program,args) { WorkingDirectory=cwd,RedirectStandardOutput=true,RedirectStandardError=true,UseShellExecute=false,CreateNoWindow=true };
    start.Environment["DOTNET_CLI_TELEMETRY_OPTOUT"]="1";
    start.Environment["DOTNET_SKIP_FIRST_TIME_EXPERIENCE"]="1";
    start.Environment["DOTNET_NOLOGO"]="1";
    start.Environment["NUGET_PACKAGES"]="/app/empty-nuget";
    using var process = new Process { StartInfo=start };
    if (!process.Start()) throw new InvalidOperationException("Cannot launch dotnet");
    try {
        var stdout=process.StandardOutput.ReadToEndAsync(cancellation);
        var stderr=process.StandardError.ReadToEndAsync(cancellation);
        await process.WaitForExitAsync(cancellation);
        return (process.ExitCode,(await stdout)+"\n"+(await stderr));
    } catch {
        if (!process.HasExited) process.Kill(entireProcessTree:true);
        throw;
    }
}
record CompileRequest([property:JsonPropertyName("code")] string? Code);
