using CS2InvestmentTracker.Core.Models.Database;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CS2InvestmentTracker.Core.ModelConfigurations;

public class ItemConfiguration : IEntityTypeConfiguration<Item>
{
    public void Configure(EntityTypeBuilder<Item> builder)
    {
        builder.ToTable("Items");
        builder.HasKey(x => x.Id);

        builder
            .Property(x => x.Name)
            .IsRequired()
            .HasMaxLength(80);

        builder
            .Property(x => x.Quantity)
            .IsRequired()
            .HasDefaultValue(1);

        builder
            .Property(x => x.BuyPrice)
            .IsRequired()
            .HasDefaultValue(0)
            .HasPrecision(18, 2);

        builder
            .Property(x => x.MinSellPrice)
            .HasPrecision(18, 2);

        builder
            .Property(x => x.AvgSellPrice)
            .HasPrecision(18, 2);

        builder
            .Property(x => x.CategoryId)
            .IsRequired(false);

        builder
            .Property(x => x.InsertDate)
            .ValueGeneratedOnAdd();

        builder
            .Property(x => x.EditDate)
            .ValueGeneratedOnUpdate();

        builder
            .HasOne(x => x.Category)
            .WithMany()
            .HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
