#!/usr/bin/env bash
set -euo pipefail
export CODEDUO_COMPILER_TOKEN="ci-only-compiler-secret-0123456789-abcdef"
dotnet run --no-build --configuration Release --project services/csharp-compiler/CodeDuo.Compiler.csproj > /tmp/codeduo-dotnet-test.log 2>&1 &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true' EXIT
for i in $(seq 1 40); do
  if curl -fsS http://127.0.0.1:8080/health >/dev/null 2>&1; then break; fi
  sleep .5
done
curl -fsS http://127.0.0.1:8080/health | grep -q '"ok":true'
valid=$(curl -fsS http://127.0.0.1:8080/compile -X POST \
 -H "Authorization: Bearer $CODEDUO_COMPILER_TOKEN" -H "Content-Type: application/json" \
 -d '{"code":"using System; class Program { static void Main() { Console.WriteLine(42); } }"}')
echo "$valid" | grep -q '"ok":true'
echo "$valid" | grep -q '"executed":false'
invalid=$(curl -fsS http://127.0.0.1:8080/compile -X POST \
 -H "Authorization: Bearer $CODEDUO_COMPILER_TOKEN" -H "Content-Type: application/json" \
 -d '{"code":"using System; class Program { static void Main() { Console.WriteLine( ; } }"}')
echo "$invalid" | grep -q '"ok":false'
echo "$invalid" | grep -q '"diagnostics":'
unauth=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8080/compile -X POST -H 'Content-Type: application/json' -d '{"code":"class A {}"}')
test "$unauth" = '401'
echo 'PASS: .NET SDK compiles valid code, reports invalid syntax, blocks unauthorized access and never executes assemblies.'
