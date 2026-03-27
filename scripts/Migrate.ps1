param(
    [Parameter(Position = 0)]
    [ValidateSet("add", "remove", "update", "list", "reset")]
    [string]$Action = "list",

    [Parameter(Position = 1)]
    [string]$MigrationName
)

$InfraProject = "C:\Coding\AutexisCase\src\AutexisCase.Infrastructure"
$ApiProject = "C:\Coding\AutexisCase\src\AutexisCase.API"

switch ($Action) {
    "add" {
        if (-not $MigrationName) {
            Write-Host "Usage: .\Migrate.ps1 add <MigrationName>" -ForegroundColor Red
            exit 1
        }
        Write-Host "Adding migration: $MigrationName" -ForegroundColor Yellow
        dotnet ef migrations add $MigrationName --project $InfraProject --startup-project $ApiProject
    }
    "remove" {
        Write-Host "Removing last migration..." -ForegroundColor Yellow
        dotnet ef migrations remove --project $InfraProject --startup-project $ApiProject
    }
    "update" {
        if ($MigrationName) {
            Write-Host "Updating database to migration: $MigrationName" -ForegroundColor Yellow
            dotnet ef database update $MigrationName --project $InfraProject --startup-project $ApiProject
        } else {
            Write-Host "Updating database to latest..." -ForegroundColor Yellow
            dotnet ef database update --project $InfraProject --startup-project $ApiProject
        }
    }
    "list" {
        Write-Host "Listing migrations..." -ForegroundColor Yellow
        dotnet ef migrations list --project $InfraProject --startup-project $ApiProject
    }
    "reset" {
        Write-Host "Resetting database..." -ForegroundColor Red
        dotnet ef database drop --project $InfraProject --startup-project $ApiProject --force
        dotnet ef database update --project $InfraProject --startup-project $ApiProject
    }
}
