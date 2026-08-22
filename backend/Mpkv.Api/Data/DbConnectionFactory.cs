using Microsoft.Data.SqlClient;
using System.Data;

namespace Mpkv.Api.Data
{
    /// <summary>
    /// Thin factory for raw SqlConnection — use when you need direct ADO.NET access
    /// outside of the Dapper-wrapped DbAccess (e.g. bulk operations).
    /// </summary>
    public class DbConnectionFactory
    {
        private readonly string _connectionString;

        public DbConnectionFactory(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
        }

        public IDbConnection CreateConnection() => new SqlConnection(_connectionString);
    }
}
