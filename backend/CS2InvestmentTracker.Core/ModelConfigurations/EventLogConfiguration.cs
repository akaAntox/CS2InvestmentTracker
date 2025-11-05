using CS2InvestmentTracker.Core.Models.Database;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CS2InvestmentTracker.Core.ModelConfigurations;

public class EventLogConfiguration : IEntityTypeConfiguration<EventLog>
{
    public void Configure(EntityTypeBuilder<EventLog> builder)
    {
        builder.ToTable("EventLogs");
        builder.HasKey(x => x.Id);

        builder
            .Property(x => x.Date)
            .ValueGeneratedOnAdd()
            .IsRequired();

        builder
            .Property(x => x.Action)
            .IsRequired()
            .HasConversion(
                value => (int)value,
                value => Enum.Parse<ActionType>(value.ToString())
            );

        builder
            .Property(x => x.Message)
            .IsRequired()
            .HasDefaultValue("");

        builder
            .Property(x => x.OldValues);

        builder
            .Property(x => x.NewValues);
    }
}
