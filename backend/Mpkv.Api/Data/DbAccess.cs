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

        /// <summary>
        /// DynamicParameters.ParameterNames strips the '@' prefix when iterating.
        /// SqlCommand.Parameters.AddWithValue requires it to match SP parameter names.
        /// This helper ensures '@' is always present.
        /// </summary>
        private static void AddParams(SqlCommand cmd, DynamicParameters? param)
        {
            if (param == null) return;
            foreach (var name in param.ParameterNames)
            {
                var sqlName = name.StartsWith("@") ? name : "@" + name;
                cmd.Parameters.AddWithValue(sqlName, param.Get<object>(name) ?? DBNull.Value);
            }
        }

        // ── Returns all rows as a DataTable (first result set only) ─────────
        public DataTable GetDataTable(string spName, DynamicParameters? param = null)
        {
            using var conn = CreateConnection();
            conn.Open();
            using var cmd = new SqlCommand(spName, conn) { CommandType = CommandType.StoredProcedure, CommandTimeout = 120 };
            AddParams(cmd, param);
            var dt = new DataTable();
            using var adapter = new SqlDataAdapter(cmd);
            adapter.Fill(dt);   // fills first result set only
            return dt;
        }

        // ── Returns multiple result-sets as a DataSet ─────────────────────────
        public DataSet GetDataSet(string spName, DynamicParameters? param = null)
        {
            using var conn = CreateConnection();
            conn.Open();
            using var cmd = new SqlCommand(spName, conn) { CommandType = CommandType.StoredProcedure, CommandTimeout = 120 };
            AddParams(cmd, param);
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
