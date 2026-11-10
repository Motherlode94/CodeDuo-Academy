FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY CodeDuo.Compiler.csproj .
RUN dotnet restore CodeDuo.Compiler.csproj
COPY Program.cs .
RUN dotnet publish CodeDuo.Compiler.csproj --no-restore -c Release -o /out
FROM mcr.microsoft.com/dotnet/sdk:8.0
WORKDIR /app
COPY --from=build /out .
RUN mkdir -p /app/empty-nuget && useradd -m -u 10001 coder && chown -R coder:coder /app /tmp
USER coder
ENV ASPNETCORE_URLS=http://0.0.0.0:8080
EXPOSE 8080
ENTRYPOINT ["dotnet","CodeDuo.Compiler.dll"]