using Mpkv.Api.Models.Candidate;

namespace Mpkv.Api.Services
{
    public interface ICandidateService
    {
        CandidateDashboardResponse GetDashboard(long candidateId);
    }

    /// <summary>
    /// Candidate service — placeholder.
    /// Full candidate logic lives in ApplicationFormService, DashboardService, etc.
    /// </summary>
    public class CandidateService : ICandidateService
    {
        public CandidateDashboardResponse GetDashboard(long candidateId)
            => new CandidateDashboardResponse { ApplicationFormStatus = "Candidate dashboard — use /api/dashboard endpoint." };
    }
}
