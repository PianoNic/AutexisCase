using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AutexisCase.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBatchEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Alerts_Products_ProductId",
                table: "Alerts");

            migrationBuilder.DropForeignKey(
                name: "FK_JourneyEvents_Products_ProductId",
                table: "JourneyEvents");

            migrationBuilder.DropForeignKey(
                name: "FK_PriceSteps_Products_ProductId",
                table: "PriceSteps");

            migrationBuilder.DropForeignKey(
                name: "FK_TemperatureLogs_Products_ProductId",
                table: "TemperatureLogs");

            migrationBuilder.DropColumn(
                name: "Co2Kg",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "DaysRemaining",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "RiskScore",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ShelfLifeDays",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "WaterLiters",
                table: "Products");

            migrationBuilder.RenameColumn(
                name: "ProductId",
                table: "TemperatureLogs",
                newName: "BatchId");

            migrationBuilder.RenameIndex(
                name: "IX_TemperatureLogs_ProductId",
                table: "TemperatureLogs",
                newName: "IX_TemperatureLogs_BatchId");

            migrationBuilder.RenameColumn(
                name: "ProductId",
                table: "PriceSteps",
                newName: "BatchId");

            migrationBuilder.RenameIndex(
                name: "IX_PriceSteps_ProductId",
                table: "PriceSteps",
                newName: "IX_PriceSteps_BatchId");

            migrationBuilder.RenameColumn(
                name: "ProductId",
                table: "JourneyEvents",
                newName: "BatchId");

            migrationBuilder.RenameIndex(
                name: "IX_JourneyEvents_ProductId",
                table: "JourneyEvents",
                newName: "IX_JourneyEvents_BatchId");

            migrationBuilder.RenameColumn(
                name: "ProductId",
                table: "Alerts",
                newName: "BatchId");

            migrationBuilder.RenameIndex(
                name: "IX_Alerts_ProductId",
                table: "Alerts",
                newName: "IX_Alerts_BatchId");

            migrationBuilder.CreateTable(
                name: "Batches",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    LotNumber = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    RiskScore = table.Column<int>(type: "integer", nullable: false),
                    ShelfLifeDays = table.Column<int>(type: "integer", nullable: true),
                    DaysRemaining = table.Column<int>(type: "integer", nullable: true),
                    Co2Kg = table.Column<decimal>(type: "numeric", nullable: true),
                    WaterLiters = table.Column<decimal>(type: "numeric", nullable: true),
                    ProductionDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ExpiryDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Batches", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Batches_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Batches_ProductId_LotNumber",
                table: "Batches",
                columns: new[] { "ProductId", "LotNumber" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Alerts_Batches_BatchId",
                table: "Alerts",
                column: "BatchId",
                principalTable: "Batches",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_JourneyEvents_Batches_BatchId",
                table: "JourneyEvents",
                column: "BatchId",
                principalTable: "Batches",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PriceSteps_Batches_BatchId",
                table: "PriceSteps",
                column: "BatchId",
                principalTable: "Batches",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TemperatureLogs_Batches_BatchId",
                table: "TemperatureLogs",
                column: "BatchId",
                principalTable: "Batches",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Alerts_Batches_BatchId",
                table: "Alerts");

            migrationBuilder.DropForeignKey(
                name: "FK_JourneyEvents_Batches_BatchId",
                table: "JourneyEvents");

            migrationBuilder.DropForeignKey(
                name: "FK_PriceSteps_Batches_BatchId",
                table: "PriceSteps");

            migrationBuilder.DropForeignKey(
                name: "FK_TemperatureLogs_Batches_BatchId",
                table: "TemperatureLogs");

            migrationBuilder.DropTable(
                name: "Batches");

            migrationBuilder.RenameColumn(
                name: "BatchId",
                table: "TemperatureLogs",
                newName: "ProductId");

            migrationBuilder.RenameIndex(
                name: "IX_TemperatureLogs_BatchId",
                table: "TemperatureLogs",
                newName: "IX_TemperatureLogs_ProductId");

            migrationBuilder.RenameColumn(
                name: "BatchId",
                table: "PriceSteps",
                newName: "ProductId");

            migrationBuilder.RenameIndex(
                name: "IX_PriceSteps_BatchId",
                table: "PriceSteps",
                newName: "IX_PriceSteps_ProductId");

            migrationBuilder.RenameColumn(
                name: "BatchId",
                table: "JourneyEvents",
                newName: "ProductId");

            migrationBuilder.RenameIndex(
                name: "IX_JourneyEvents_BatchId",
                table: "JourneyEvents",
                newName: "IX_JourneyEvents_ProductId");

            migrationBuilder.RenameColumn(
                name: "BatchId",
                table: "Alerts",
                newName: "ProductId");

            migrationBuilder.RenameIndex(
                name: "IX_Alerts_BatchId",
                table: "Alerts",
                newName: "IX_Alerts_ProductId");

            migrationBuilder.AddColumn<decimal>(
                name: "Co2Kg",
                table: "Products",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DaysRemaining",
                table: "Products",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RiskScore",
                table: "Products",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ShelfLifeDays",
                table: "Products",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "Products",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "WaterLiters",
                table: "Products",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Alerts_Products_ProductId",
                table: "Alerts",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_JourneyEvents_Products_ProductId",
                table: "JourneyEvents",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PriceSteps_Products_ProductId",
                table: "PriceSteps",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TemperatureLogs_Products_ProductId",
                table: "TemperatureLogs",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
