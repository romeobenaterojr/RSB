using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Config;

public class RoleConfiguration : IEntityTypeConfiguration<IdentityRole>
{
    public void Configure(EntityTypeBuilder<IdentityRole> builder)
    {
        builder.HasData(
            new IdentityRole
            {
                Id = "1b5e2c4b-6a64-4a5b-9a44-4d9cbe3c29a1",
                Name = "Admin",
                NormalizedName = "ADMIN",
                ConcurrencyStamp = "ae45902c-1cfb-418f-8b97-6d63b4d74484"
            },
            new IdentityRole
            {
                Id = "f0e3d9e3-16b4-4a47-b0d5-b06b77c3efb7",
                Name = "Customer",
                NormalizedName = "CUSTOMER",
                ConcurrencyStamp = "1fc9e711-5e36-42a1-b21d-3a0500466d3e"
            }
        );
    }
}
