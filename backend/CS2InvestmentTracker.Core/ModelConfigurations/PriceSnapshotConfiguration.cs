using CS2InvestmentTracker.Core.Models.Database;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CS2InvestmentTracker.Core.ModelConfigurations;

public class PriceSnapshotConfiguration : IEntityTypeConfiguration<PriceSnapshot>
{
    public void Configure(EntityTypeBuilder<PriceSnapshot> builder)
    {
        builder.ToTable("PriceSnapshots");
        builder.HasKey(x => x.Id);

        // One snapshot per item per day
        builder.HasIndex(x => new { x.ItemId, x.Date }).IsUnique();
        builder.HasIndex(x => x.Date);

        builder
            .Property(x => x.Name)
            .IsRequired()
            .HasMaxLength(80);

        builder
            .Property(x => x.BuyPrice)
            .HasPrecision(18, 2);

        builder
            .Property(x => x.MinSellPrice)
            .HasPrecision(18, 2);

        builder
            .Property(x => x.AvgSellPrice)
            .HasPrecision(18, 2);
    }
}
