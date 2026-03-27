using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AutexisCase.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProductDomain : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Products",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Gtin = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Brand = table.Column<string>(type: "text", nullable: false),
                    ImageUrl = table.Column<string>(type: "text", nullable: true),
                    Category = table.Column<string>(type: "text", nullable: true),
                    Weight = table.Column<string>(type: "text", nullable: true),
                    Origin = table.Column<string>(type: "text", nullable: true),
                    Certifications = table.Column<string>(type: "jsonb", nullable: false),
                    NutriScore = table.Column<string>(type: "text", nullable: true),
                    NovaGroup = table.Column<int>(type: "integer", nullable: true),
                    EcoScore = table.Column<string>(type: "text", nullable: true),
                    RiskScore = table.Column<int>(type: "integer", nullable: false),
                    ShelfLifeDays = table.Column<int>(type: "integer", nullable: true),
                    DaysRemaining = table.Column<int>(type: "integer", nullable: true),
                    Co2Kg = table.Column<decimal>(type: "numeric", nullable: true),
                    WaterLiters = table.Column<decimal>(type: "numeric", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Nutrition_EnergyKcal = table.Column<decimal>(type: "numeric", nullable: false),
                    Nutrition_Fat = table.Column<decimal>(type: "numeric", nullable: false),
                    Nutrition_SaturatedFat = table.Column<decimal>(type: "numeric", nullable: false),
                    Nutrition_Carbs = table.Column<decimal>(type: "numeric", nullable: false),
                    Nutrition_Sugars = table.Column<decimal>(type: "numeric", nullable: false),
                    Nutrition_Fiber = table.Column<decimal>(type: "numeric", nullable: false),
                    Nutrition_Protein = table.Column<decimal>(type: "numeric", nullable: false),
                    Nutrition_Salt = table.Column<decimal>(type: "numeric", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Products", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Alerts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Severity = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Read = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Alerts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Alerts_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "JourneyEvents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    Step = table.Column<string>(type: "text", nullable: false),
                    Location = table.Column<string>(type: "text", nullable: false),
                    Latitude = table.Column<double>(type: "double precision", nullable: false),
                    Longitude = table.Column<double>(type: "double precision", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Icon = table.Column<string>(type: "text", nullable: true),
                    Temperature = table.Column<decimal>(type: "numeric", nullable: true),
                    Details = table.Column<string>(type: "text", nullable: true),
                    Co2Kg = table.Column<decimal>(type: "numeric", nullable: true),
                    WaterLiters = table.Column<decimal>(type: "numeric", nullable: true),
                    Cost = table.Column<decimal>(type: "numeric", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JourneyEvents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_JourneyEvents_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PriceSteps",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    Stage = table.Column<string>(type: "text", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric", nullable: false),
                    Percentage = table.Column<decimal>(type: "numeric", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PriceSteps", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PriceSteps_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TemperatureLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    Time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Temperature = table.Column<decimal>(type: "numeric", nullable: false),
                    Location = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TemperatureLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TemperatureLogs_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Alerts_ProductId",
                table: "Alerts",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_JourneyEvents_ProductId",
                table: "JourneyEvents",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_PriceSteps_ProductId",
                table: "PriceSteps",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_Products_Gtin",
                table: "Products",
                column: "Gtin",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TemperatureLogs_ProductId",
                table: "TemperatureLogs",
                column: "ProductId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Alerts");

            migrationBuilder.DropTable(
                name: "JourneyEvents");

            migrationBuilder.DropTable(
                name: "PriceSteps");

            migrationBuilder.DropTable(
                name: "TemperatureLogs");

            migrationBuilder.DropTable(
                name: "Products");
        }
    }
}
