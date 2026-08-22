using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;

namespace Mpkv.Api.Data
{
    /// <summary>
    /// Dapper-based DB helper — mirrors the pattern from the old Admission.Data project.
    /// All SP calls go through here. Shared by Candidate, College and Admin flows.
    /// </summary>
    public class DbAccess
    {
        private readonly string _connectionString;

        public DbAccess(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
        }

        private SqlConnection CreateConnection() => new SqlConnection(_connectionString);

        // ── Returns all rows as a DataTable ──────────────────────────────────
        public DataTable GetDataTable(string spName, DynamicParameters? param = null)
        {
            using var conn   = CreateConnection();
            using var reader = conn.ExecuteReader(spName, param, commandType: CommandType.StoredProcedure);
            var dt = new DataTable();
            dt.Load(reader);
            return dt;
        }

        // ── Returns multiple result-sets as a DataSet ─────────────────────────
        public DataSet GetDataSet(string spName, DynamicParameters? param = null)
        {
            using var conn = CreateConnection();
            conn.Open();
            using var cmd = new SqlCommand(spName, conn) { CommandType = CommandType.StoredProcedure };

            if (param != null)
                foreach (var name in param.ParameterNames)
                    cmd.Parameters.AddWithValue(name, param.Get<object>(name) ?? DBNull.Value);

            var ds = new DataSet();
            using var adapter = new SqlDataAdapter(cmd);
            adapter.Fill(ds);
            return ds;
        }

        // ── Returns a single scalar value ────────────────────────────────────
        public object? ExecuteScalar(string spName, DynamicParameters? param = null)
        {
            using var conn = CreateConnection();
            return conn.ExecuteScalar(spName, param, commandType: CommandType.StoredProcedure);
        }

        // ── Executes a SP with no return value ───────────────────────────────
        public void ExecuteNonQuery(string spName, DynamicParameters? param = null)
        {
            using var conn = CreateConnection();
            conn.Execute(spName, param, commandType: CommandType.StoredProcedure);
        }

        // ── Returns a strongly-typed list ─────────────────────────────────────
        public IEnumerable<T> Query<T>(string spName, DynamicParameters? param = null)
        {
            using var conn = CreateConnection();
            return conn.Query<T>(spName, param, commandType: CommandType.StoredProcedure);
        }

        // ── Returns a single strongly-typed row (or null) ────────────────────
        public T? QuerySingleOrDefault<T>(string spName, DynamicParameters? param = null)
        {
            using var conn = CreateConnection();
            return conn.QuerySingleOrDefault<T>(spName, param, commandType: CommandType.StoredProcedure);
        }
    }
}
