using Dapper;
using Mpkv.Api.Data;
using Mpkv.Api.Models.Candidate;

namespace Mpkv.Api.Services
{
    public interface IRegistrationService { RegistrationStatusResponse GetRegistrationStatus(); RegistrationMastersResponse GetMasters(); RegisterResponse Register(RegisterRequest request, string ipAddress); RegistrationInfoResponse GetRegistrationInfo(string loginId); }

    public class RegistrationService : IRegistrationService
    {
        private readonly DbAccess _db;
        public RegistrationService(DbAccess db) => _db = db;

        public RegistrationStatusResponse GetRegistrationStatus() { try { var result = _db.ExecuteScalar("Base_IsNewCandidateRegistrationStarted"); return new RegistrationStatusResponse { IsOpen = result != null && Convert.ToBoolean(result) }; } catch { return new RegistrationStatusResponse { IsOpen = false }; } }

        public RegistrationMastersResponse GetMasters()
        {
            var r = new RegistrationMastersResponse();
            try { var dt = _db.GetDataTable("Base_GetMasterCourse"); if (dt != null) foreach (System.Data.DataRow row in dt.Rows) r.Courses.Add(new DropdownItem { Value = row[0].ToString()!, Text = row[1].ToString()! }); } catch { }
            try { var p = new DynamicParameters(); p.Add("@TableName","Master_Gender"); p.Add("@DataValueField","GenderCode"); p.Add("@DataTextField","Gender"); p.Add("@ParentField",""); p.Add("@ParentFieldValue",""); p.Add("@OrderByFields","GenderCode"); var dt = _db.GetDataTable("Base_GetMasterTableList", p); if (dt != null) foreach (System.Data.DataRow row in dt.Rows) r.Genders.Add(new DropdownItem { Value = row[0].ToString()!, Text = row[1].ToString()! }); } catch { }
            try { var p = new DynamicParameters(); p.Add("@TableName","Master_SecurityQuestion"); p.Add("@DataValueField","SecurityQuestionID"); p.Add("@DataTextField","SecurityQuestion"); p.Add("@ParentField",""); p.Add("@ParentFieldValue",""); p.Add("@OrderByFields","SecurityQuestion"); var dt = _db.GetDataTable("Base_GetMasterTableList", p); if (dt != null) foreach (System.Data.DataRow row in dt.Rows) r.SecurityQuestions.Add(new DropdownItem { Value = row[0].ToString()!, Text = row[1].ToString()! }); } catch { }
            return r;
        }

        public RegisterResponse Register(RegisterRequest request, string ipAddress)
        {
            try
            {
                var mp = new DynamicParameters(); mp.Add("@CandidateID", 0L); mp.Add("@MobileNo", request.MobileNo.Trim()); if (_db.ExecuteScalar("ApplicationForm_IsApplicationFormAlreadyRegisteredUsingThisMobileNo", mp) is {} mr && Convert.ToBoolean(mr)) return new RegisterResponse { Success = false, Message = $"Application Form using Mobile Number {request.MobileNo} is already registered." };
                var ep = new DynamicParameters(); ep.Add("@CandidateID", 0L); ep.Add("@EMailID", request.EMailID.Trim().ToLower()); if (_db.ExecuteScalar("ApplicationForm_IsApplicationFormAlreadyRegisteredUsingThisEMailID", ep) is {} er && Convert.ToBoolean(er)) return new RegisterResponse { Success = false, Message = $"Application Form using E-Mail ID {request.EMailID} is already registered." };
                if (!DateTime.TryParseExact(request.DOB.Trim(), new[] { "dd/MM/yyyy","yyyy-MM-dd","MM/dd/yyyy" }, System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None, out DateTime dob)) return new RegisterResponse { Success = false, Message = "Invalid date of birth format. Use dd/MM/yyyy." };
                string encodedPassword = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(request.Password));
                var rp = new DynamicParameters(); rp.Add("@AppliedCourseID", request.AppliedCourseID); rp.Add("@CandidateName", request.CandidateName.Trim().ToUpper()); rp.Add("@FatherName", request.FatherName.Trim().ToUpper()); rp.Add("@MotherName", request.MotherName.Trim().ToUpper()); rp.Add("@GenderCode", request.GenderCode); rp.Add("@DOB", dob); rp.Add("@MobileNo", request.MobileNo.Trim()); rp.Add("@EMailID", request.EMailID.Trim().ToLower()); rp.Add("@SecurityQuestionID", request.SecurityQuestionID); rp.Add("@SecurityQuestionAnswer", request.SecurityQuestionAnswer.Trim().ToUpper()); rp.Add("@Password", encodedPassword); rp.Add("@UserLoginID",""); rp.Add("@IPAddress", ipAddress); rp.Add("@PageCode","Registration");
                var returnValue = _db.ExecuteScalar("ApplicationForm_RegisterCandidate", rp)?.ToString() ?? "";
                if (returnValue.Length == 10) return new RegisterResponse { Success = true, Message = "Registration successful.", LoginID = returnValue, CandidateName = request.CandidateName.Trim().ToUpper() };
                return new RegisterResponse { Success = false, Message = returnValue.Length > 0 ? returnValue : "Registration failed. Please try again." };
            }
            catch (Exception ex) { return new RegisterResponse { Success = false, Message = $"Registration error: {ex.Message}" }; }
        }

        public RegistrationInfoResponse GetRegistrationInfo(string loginId)
        {
            try { if (string.IsNullOrWhiteSpace(loginId)) return new RegistrationInfoResponse { Found = false }; var p = new DynamicParameters(); p.Add("@UserLoginID", loginId.Trim()); var name = _db.ExecuteScalar("Account_GetUserName", p)?.ToString() ?? ""; if (string.IsNullOrEmpty(name)) return new RegistrationInfoResponse { Found = false }; return new RegistrationInfoResponse { Found = true, LoginID = loginId.Trim(), CandidateName = name }; }
            catch { return new RegistrationInfoResponse { Found = false }; }
        }
    }
}
