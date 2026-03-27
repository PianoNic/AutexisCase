using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AutexisCase.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRouteCache : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RouteCaches",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CacheKey = table.Column<string>(type: "text", nullable: false),
                    PointsJson = table.Column<string>(type: "text", nullable: false),
                    Profile = table.Column<string>(type: "text", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RouteCaches", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RouteCaches_CacheKey",
                table: "RouteCaches",
                column: "CacheKey",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RouteCaches");
        }
    }
}
