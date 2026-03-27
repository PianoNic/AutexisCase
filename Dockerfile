FROM mcr.microsoft.com/dotnet/sdk:10.0 AS backend-deps
WORKDIR /src
COPY src/AutexisCase.Domain/AutexisCase.Domain.csproj AutexisCase.Domain/
COPY src/AutexisCase.Application/AutexisCase.Application.csproj AutexisCase.Application/
COPY src/AutexisCase.Infrastructure/AutexisCase.Infrastructure.csproj AutexisCase.Infrastructure/
COPY src/AutexisCase.API/AutexisCase.API.csproj AutexisCase.API/
RUN dotnet restore AutexisCase.API/AutexisCase.API.csproj

FROM backend-deps AS backend-build
COPY src/ .
RUN dotnet publish AutexisCase.API/AutexisCase.API.csproj -c Release -o /app/publish


FROM oven/bun:1 AS frontend-deps
WORKDIR /app
COPY src/AutexisCase.Frontend/package.json src/AutexisCase.Frontend/bun.lock ./
RUN bun install --frozen-lockfile

FROM frontend-deps AS frontend-build
COPY src/AutexisCase.Frontend/ .
RUN bun run build



FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=backend-build /app/publish .
COPY --from=frontend-build /app/dist/AutexisCase.Frontend/browser wwwroot/
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "AutexisCase.API.dll"]
