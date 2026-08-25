using Dapper;
using Mpkv.Api.Data;
using Mpkv.Api.Models.Candidate;
using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Http;

namespace Mpkv.Api.Services
{
    public interface IApplicationFormService
    {
        PersonalMastersResponse  GetPersonalMasters();
        PersonalDetailsResponse  GetPersonalDetails(long candidateId, string userLoginId);
        SavePersonalResponse     SavePersonalDetails(long candidateId, string userLoginId, string ipAddress, SavePersonalRequest request);
        AddressMastersResponse   GetAddressMasters();
        AddressDetailsResponse   GetAddressDetails(long candidateId, string userLoginId);
        SaveAddressResponse      SaveAddressDetails(long candidateId, string userLoginId, string ipAddress, SaveAddressRequest request);
        SportsMastersResponse  GetSportsMasters();
        SportsDetailsResponse  GetSportsDetails(long candidateId, string userLoginId);
        SaveSportsResponse     SaveSportsDetails(long candidateId, string userLoginId, string ipAddress, SaveSportsRequest request);
        AvailableOptionsResponse  GetAvailableOptions(long candidateId);
        ShortlistedOptionsResponse GetShortlistedOptions(long candidateId);
        OptionActionResponse      AddOption(long candidateId, string userLoginId, string ipAddress, long collegeId);
        OptionActionResponse      RemoveOption(long candidateId, string userLoginId, string ipAddress, long collegeId);
        SaveShortlistResponse     SaveShortlist(long candidateId, string userLoginId, string ipAddress);
        PreferencedOptionsResponse GetPreferencedOptions(long candidateId);
        SavePreferencesResponse    SavePreferences(long candidateId, string userLoginId, string ipAddress, SavePreferencesRequest request);
        SavePreferencesResponse    ResetPreferences(long candidateId, string userLoginId, string ipAddress);
        PhotoSignDetailsResponse GetPhotoSignDetails(long candidateId, string userLoginId);
        Task<UploadPhotoSignResponse> UploadPhoto(long candidateId, string userLoginId, string ipAddress, IFormFile file);
        Task<UploadPhotoSignResponse> UploadSign(long candidateId, string userLoginId, string ipAddress, IFormFile file);
        SavePhotoSignResponse SavePhotoSign(long candidateId, string userLoginId, string ipAddress);
        QualificationMastersResponse  GetQualificationMasters();
        QualificationDetailsResponse  GetQualificationDetails(long candidateId, string userLoginId);
        SaveQualificationResponse     SaveQualificationDetails(long candidateId, string userLoginId, string ipAddress, SaveQualificationRequest request);
        DocumentsListResponse     GetDocumentsList(long candidateId, string userLoginId);
        Task<UploadDocumentResponse> UploadDocument(long candidateId, string userLoginId, string ipAddress, UploadDocumentRequest request, IFormFile file);
        DocumentActionResponse    DeleteDocument(long candidateId, string userLoginId, string ipAddress, int documentId);
        SaveDocumentsResponse     SaveDocuments(long candidateId, string userLoginId, string ipAddress);
        CategoryMastersResponse  GetCategoryMasters();
        CategoryDetailsResponse  GetCategoryDetails(long candidateId, string userLoginId);
        SaveCategoryResponse     SaveCategoryDetails(long candidateId, string userLoginId, string ipAddress, SaveCategoryRequest request);
        FeeDetailsResponse   GetFeeDetails(long candidateId, string userLoginId);
        FeeInitiateResponse  InitiateFeeTransaction(long candidateId, string userLoginId, string ipAddress, int paymentGatewayId);
        FeeProceedResponse   SaveFeeDetails(long candidateId, string userLoginId, string ipAddress);
        // ── Summary & Lock ────────────────────────────────────────────────────
        ApplicationFormSummaryResponse GetApplicationFormSummary(long candidateId, string userLoginId);
        LockFormResponse               LockApplicationForm(long candidateId, string userLoginId, string ipAddress);
        UnlockEligibilityResponse      GetUnlockEligibility(long candidateId, string userLoginId);
        LockFormResponse               UnlockApplicationForm(long candidateId, string userLoginId, string ipAddress);
    }

    public class ApplicationFormService : IApplicationFormService
    {
        private readonly DbAccess _db;
        private readonly IConfiguration _config;
        public ApplicationFormService(DbAccess db, IConfiguration config) { _db = db; _config = config; }

        public static string CalculateAge(DateTime dob)
        {
            var cutoff = new DateTime(2026, 7, 1);
            int years = cutoff.Year - dob.Year, months = cutoff.Month - dob.Month, days = cutoff.Day - dob.Day;
            if (days < 0) { months--; days += DateTime.DaysInMonth(cutoff.Year, cutoff.Month == 1 ? 12 : cutoff.Month - 1); }
            if (months < 0) { years--; months += 12; }
            return $"{years} Years {months} Months {days} Days";
        }

        public PersonalMastersResponse GetPersonalMasters()
        {
            var r = new PersonalMastersResponse();
            try { var dt = _db.GetDataTable("Base_GetMasterCourse"); if (dt != null) foreach (System.Data.DataRow row in dt.Rows) { var v = row[0].ToString()!; if (v != "-1") r.Courses.Add(new DropdownItem { Value = v, Text = row[1].ToString()! }); } } catch { }
            try { var p = new DynamicParameters(); p.Add("@TableName","Master_Gender"); p.Add("@DataValueField","GenderCode"); p.Add("@DataTextField","Gender"); p.Add("@ParentField",""); p.Add("@ParentFieldValue",""); p.Add("@OrderByFields","GenderCode"); var dt = _db.GetDataTable("Base_GetMasterTableList", p); if (dt != null) foreach (System.Data.DataRow row in dt.Rows) r.Genders.Add(new DropdownItem { Value = row[0].ToString()!, Text = row[1].ToString()! }); } catch { }
            return r;
        }

        public PersonalDetailsResponse GetPersonalDetails(long candidateId, string userLoginId)
        {
            var r = new PersonalDetailsResponse();
            try { var p = new DynamicParameters(); p.Add("@CandidateID", candidateId); p.Add("@UserLoginID", userLoginId); p.Add("@PageCode","Personal"); var dt = _db.GetDataTable("ApplicationForm_GetPersonalDetails", p); if (dt == null || dt.Rows.Count == 0) return r; var row = dt.Rows[0]; r.Found = true; r.CandidateID = Convert.ToInt64(row["CandidateID"]); r.ApplicationID = row["ApplicationID"].ToString()!; r.AppliedCourseID = Convert.ToInt32(row["AppliedCourseID"]); r.CandidateName = row["CandidateName"].ToString()!; r.FatherName = row["FatherName"].ToString()!; r.MotherName = row["MotherName"].ToString()!; r.GenderCode = row["GenderCode"].ToString()!; if (row["DOB"] != DBNull.Value) { var dob = Convert.ToDateTime(row["DOB"]); r.DOB = dob.ToString("yyyy-MM-dd"); r.Age = CalculateAge(dob); } r.MobileNo = row["MobileNo"].ToString()!; r.EmailID = row["EMailID"].ToString()!; r.IsResidentOfIndia = row["IsResidentOfIndia"] != DBNull.Value ? Convert.ToInt16(row["IsResidentOfIndia"]) : (short)1; } catch (Exception ex) { Console.WriteLine($"GetPersonalDetails error: {ex.Message}"); }
            return r;
        }

        public SavePersonalResponse SavePersonalDetails(long candidateId, string userLoginId, string ipAddress, SavePersonalRequest request)
        {
            try { if (!DateTime.TryParseExact(request.DOB.Trim(), new[] { "dd/MM/yyyy","yyyy-MM-dd" }, System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None, out DateTime dob)) return new SavePersonalResponse { Success = false, Message = "Invalid date of birth format." }; var p = new DynamicParameters(); p.Add("@CandidateID", candidateId); p.Add("@AppliedCourseID", request.AppliedCourseID); p.Add("@CandidateName", request.CandidateName.Trim().ToUpper()); p.Add("@FatherName", request.FatherName.Trim().ToUpper()); p.Add("@MotherName", request.MotherName.Trim().ToUpper()); p.Add("@GenderCode", request.GenderCode); p.Add("@DOB", dob); p.Add("@Age", CalculateAge(dob)); p.Add("@MobileNo", request.MobileNo.Trim()); p.Add("@EMailID", request.EmailID.Trim().ToLower()); p.Add("@IsResidentOfIndia", request.IsResidentOfIndia); p.Add("@UserLoginID", userLoginId); p.Add("@IPAddress", ipAddress); p.Add("@PageCode","Personal"); var result = _db.ExecuteScalar("ApplicationForm_SavePersonalDetails", p)?.ToString() ?? ""; if (result.ToUpper() == "Y") { UpdateStatus(candidateId, userLoginId, ipAddress, "Personal"); return new SavePersonalResponse { Success = true, Message = "Personal details saved successfully." }; } return new SavePersonalResponse { Success = false, Message = result.Length > 0 ? result : "Data has not been saved. Please try again." }; } catch (Exception ex) { return new SavePersonalResponse { Success = false, Message = ex.Message }; }
        }

        public AddressMastersResponse GetAddressMasters()
        {
            var r = new AddressMastersResponse();
            try { var p = new DynamicParameters(); p.Add("@TableName","Master_State"); p.Add("@DataValueField","StateID"); p.Add("@DataTextField","State"); p.Add("@ParentField",""); p.Add("@ParentFieldValue",""); p.Add("@OrderByFields","State"); var dt = _db.GetDataTable("Base_GetMasterTableList", p); if (dt != null) foreach (System.Data.DataRow row in dt.Rows) { var v = row[0].ToString()!; if (v != "-1") r.States.Add(new DropdownItem { Value = v, Text = row[1].ToString()! }); } } catch { }
            try { var dt = _db.GetDataTable("Base_GetMasterDistrict"); if (dt != null) foreach (System.Data.DataRow row in dt.Rows) { var v = row[0].ToString()!; if (v == "-1") continue; r.Districts.Add(new DropdownItemGrouped { Value = v, Text = row[1].ToString()!, Group = row[2].ToString()! }); } } catch { }
            return r;
        }

        public AddressDetailsResponse GetAddressDetails(long candidateId, string userLoginId)
        {
            var r = new AddressDetailsResponse();
            try { var p = new DynamicParameters(); p.Add("@CandidateID", candidateId); p.Add("@UserLoginID", userLoginId); p.Add("@PageCode","Address"); var dt = _db.GetDataTable("ApplicationForm_GetAddressDetails", p); if (dt == null || dt.Rows.Count == 0) return r; var row = dt.Rows[0]; r.Found = Convert.ToInt64(row["CandidateID"]) > 0; r.AddressLine1 = row["AddressLine1"].ToString()!; r.AddressLine2 = row["AddressLine2"].ToString()!; r.StateID = row["StateID"] != DBNull.Value ? Convert.ToInt32(row["StateID"]) : 27; r.DistrictID = row["DistrictID"] != DBNull.Value ? Convert.ToInt32(row["DistrictID"]) : 0; r.City = row["City"].ToString()!; r.Pincode = row["Pincode"].ToString()!; r.IsCorrAddressSameAsPermanent = row["IsCorrAddressSameAsPermanent"] != DBNull.Value && Convert.ToBoolean(row["IsCorrAddressSameAsPermanent"]); r.CorrAddressLine1 = row["CorrAddressLine1"].ToString()!; r.CorrAddressLine2 = row["CorrAddressLine2"].ToString()!; r.CorrStateID = row["CorrStateID"] != DBNull.Value ? Convert.ToInt32(row["CorrStateID"]) : 27; r.CorrDistrictID = row["CorrDistrictID"] != DBNull.Value ? Convert.ToInt32(row["CorrDistrictID"]) : 0; r.CorrCity = row["CorrCity"].ToString()!; r.CorrPincode = row["CorrPincode"].ToString()!; } catch (Exception ex) { Console.WriteLine($"GetAddressDetails error: {ex.Message}"); }
            return r;
        }

        public SaveAddressResponse SaveAddressDetails(long candidateId, string userLoginId, string ipAddress, SaveAddressRequest request)
        {
            try { string a1, a2, city, pincode; int stateId, districtId; if (request.IsCorrAddressSameAsPermanent) { a1 = request.CorrAddressLine1.Trim().ToUpper(); a2 = request.CorrAddressLine2.Trim().ToUpper(); stateId = request.CorrStateID; districtId = request.CorrDistrictID; city = request.CorrCity.Trim().ToUpper(); pincode = request.CorrPincode.Trim(); } else { a1 = request.AddressLine1.Trim().ToUpper(); a2 = request.AddressLine2.Trim().ToUpper(); stateId = request.StateID; districtId = request.DistrictID; city = request.City.Trim().ToUpper(); pincode = request.Pincode.Trim(); } var p = new DynamicParameters(); p.Add("@CandidateID", candidateId); p.Add("@AddressLine1", a1); p.Add("@AddressLine2", a2); p.Add("@StateID", stateId); p.Add("@DistrictID", districtId); p.Add("@City", city); p.Add("@Pincode", pincode); p.Add("@IsCorrAddressSameAsPermanent", request.IsCorrAddressSameAsPermanent); p.Add("@CorrAddressLine1", request.IsCorrAddressSameAsPermanent ? a1 : request.CorrAddressLine1.Trim().ToUpper()); p.Add("@CorrAddressLine2", request.IsCorrAddressSameAsPermanent ? a2 : request.CorrAddressLine2.Trim().ToUpper()); p.Add("@CorrStateID", request.IsCorrAddressSameAsPermanent ? stateId : request.CorrStateID); p.Add("@CorrDistrictID", request.IsCorrAddressSameAsPermanent ? districtId : request.CorrDistrictID); p.Add("@CorrCity", request.IsCorrAddressSameAsPermanent ? city : request.CorrCity.Trim().ToUpper()); p.Add("@CorrPincode", request.IsCorrAddressSameAsPermanent ? pincode : request.CorrPincode.Trim()); p.Add("@UserLoginID", userLoginId); p.Add("@IPAddress", ipAddress); p.Add("@PageCode","Address"); var result = _db.ExecuteScalar("ApplicationForm_SaveAddressDetails", p)?.ToString() ?? ""; if (result.ToUpper() == "Y") { UpdateStatus(candidateId, userLoginId, ipAddress, "Address"); return new SaveAddressResponse { Success = true, Message = "Address details saved successfully." }; } return new SaveAddressResponse { Success = false, Message = result.Length > 0 ? result : "Data has not been saved. Please try again." }; } catch (Exception ex) { return new SaveAddressResponse { Success = false, Message = ex.Message }; }
        }

        public CategoryMastersResponse GetCategoryMasters()
        {
            var r = new CategoryMastersResponse();
            try { var dt = _db.GetDataTable("Base_GetMasterDistrict"); if (dt != null) foreach (System.Data.DataRow row in dt.Rows) { var g = row[2].ToString()!; var v = row[0].ToString()!; if (v == "-1" || g == "-1") continue; if (g == "27") r.DomicileDistricts.Add(new DropdownItem { Value = v, Text = row[1].ToString()! }); } } catch { }
            try { var p = new DynamicParameters(); p.Add("@TableName","Master_Category"); p.Add("@DataValueField","CategoryID"); p.Add("@DataTextField","Category"); p.Add("@ParentField",""); p.Add("@ParentFieldValue",""); p.Add("@OrderByFields","SeqNo"); var dt = _db.GetDataTable("Base_GetMasterTableList", p); if (dt != null) foreach (System.Data.DataRow row in dt.Rows) { var v = row[0].ToString()!; if (v != "-1") r.Categories.Add(new DropdownItem { Value = v, Text = row[1].ToString()! }); } } catch { }
            return r;
        }

        public CategoryDetailsResponse GetCategoryDetails(long candidateId, string userLoginId)
        {
            var r = new CategoryDetailsResponse();
            try { var p = new DynamicParameters(); p.Add("@CandidateID", candidateId); p.Add("@UserLoginID", userLoginId); p.Add("@PageCode","CategoryAndOtherReservation"); var dt = _db.GetDataTable("ApplicationForm_GetCategoryAndOtherReservationDetails", p); if (dt == null || dt.Rows.Count == 0) return r; var row = dt.Rows[0]; if (row["CandidateID"] == DBNull.Value || Convert.ToInt64(row["CandidateID"]) == 0) return r; r.Found = true; r.DomicileDistrictID = row["DomicileDistrictID"] != DBNull.Value ? Convert.ToInt32(row["DomicileDistrictID"]) : 0; r.DomicileVillage = row["DomicileVillage"].ToString()!; r.CategoryID = row["CategoryID"] != DBNull.Value ? Convert.ToInt32(row["CategoryID"]) : 0; r.Caste = row["Caste"].ToString()!; r.HasCasteCertificate = row["HasCasteCertificate"] != DBNull.Value ? Convert.ToInt16(row["HasCasteCertificate"]) : (short)0; r.HasReceiptCasteCertificate = row["HasReceiptCasteCertificate"] != DBNull.Value ? Convert.ToInt16(row["HasReceiptCasteCertificate"]) : (short)0; r.HasNCLCertificate = row["HasNCLCertificate"] != DBNull.Value ? Convert.ToInt16(row["HasNCLCertificate"]) : (short)0; r.HasNCLReceipt = row["HasNCLReceipt"] != DBNull.Value ? Convert.ToInt16(row["HasNCLReceipt"]) : (short)0; r.HasEWSCertificate = row["HasEWSCertificate"] != DBNull.Value ? Convert.ToInt16(row["HasEWSCertificate"]) : (short)0; r.IsOrphan = row["IsOrphan"] != DBNull.Value ? Convert.ToInt16(row["IsOrphan"]) : (short)0; r.IsPWD = row["IsPWD"] != DBNull.Value ? Convert.ToInt16(row["IsPWD"]) : (short)0; r.IsExServiceman = row["IsExServiceman"] != DBNull.Value ? Convert.ToInt16(row["IsExServiceman"]) : (short)0; r.IsFreedomFighter = row["IsFreedomFighter"] != DBNull.Value ? Convert.ToInt16(row["IsFreedomFighter"]) : (short)0; r.IsProjectAffected = row["IsProjectAffected"] != DBNull.Value ? Convert.ToInt16(row["IsProjectAffected"]) : (short)0; r.IsNCC = row["IsNCC"] != DBNull.Value ? Convert.ToInt16(row["IsNCC"]) : (short)0; r.IsSports = row["IsSports"] != DBNull.Value ? Convert.ToInt16(row["IsSports"]) : (short)0; r.IsMPKVEmployee = row["IsMPKVEmployee"] != DBNull.Value ? Convert.ToInt16(row["IsMPKVEmployee"]) : (short)0; r.IsLandlessFarmLabourer = row["IsLandlessFarmLabourer"] != DBNull.Value ? Convert.ToInt16(row["IsLandlessFarmLabourer"]) : (short)0; r.IsIncomeSourceAgriculture = row["IsIncomeSourceAgriculture"] != DBNull.Value ? Convert.ToInt16(row["IsIncomeSourceAgriculture"]) : (short)0; r.HasFarm = row["HasFarm"] != DBNull.Value ? Convert.ToInt16(row["HasFarm"]) : (short)0; } catch (Exception ex) { Console.WriteLine($"GetCategoryDetails error: {ex.Message}"); }
            return r;
        }

        public SaveCategoryResponse SaveCategoryDetails(long candidateId, string userLoginId, string ipAddress, SaveCategoryRequest request)
        {
            try { var p = new DynamicParameters(); p.Add("@CandidateID", candidateId); p.Add("@DomicileDistrictID", request.DomicileDistrictID); p.Add("@DomicileVillage", request.DomicileVillage.Trim()); p.Add("@CategoryID", request.CategoryID); p.Add("@FinalCategoryID", request.FinalCategoryID); p.Add("@Caste", request.Caste.Trim().ToUpper()); p.Add("@HasCasteCertificate", request.HasCasteCertificate); p.Add("@HasReceiptCasteCertificate", request.HasReceiptCasteCertificate); p.Add("@HasNCLCertificate", request.HasNCLCertificate); p.Add("@HasNCLReceipt", request.HasNCLReceipt); p.Add("@HasEWSCertificate", request.HasEWSCertificate); p.Add("@IsOrphan", request.IsOrphan); p.Add("@IsPWD", request.IsPWD); p.Add("@IsExServiceman", request.IsExServiceman); p.Add("@IsFreedomFighter", request.IsFreedomFighter); p.Add("@IsProjectAffected", request.IsProjectAffected); p.Add("@IsNCC", request.IsNCC); p.Add("@IsSports", request.IsSports); p.Add("@IsMPKVEmployee", request.IsMPKVEmployee); p.Add("@IsLandlessFarmLabourer", request.IsLandlessFarmLabourer); p.Add("@IsIncomeSourceAgriculture", request.IsIncomeSourceAgriculture); p.Add("@HasFarm", request.HasFarm); p.Add("@UserLoginID", userLoginId); p.Add("@IPAddress", ipAddress); p.Add("@PageCode","CategoryAndOtherReservation"); var result = _db.ExecuteScalar("ApplicationForm_SaveCategoryAndOtherReservationDetails", p)?.ToString() ?? ""; if (result.ToUpper() == "Y") { UpdateStatus(candidateId, userLoginId, ipAddress, "CategoryAndOtherReservation"); SetRequiredDocuments(candidateId, userLoginId, ipAddress, "CategoryAndOtherReservation"); return new SaveCategoryResponse { Success = true, Message = "Category details saved successfully." }; } return new SaveCategoryResponse { Success = false, Message = result.Length > 0 ? result : "Data has not been saved. Please try again." }; } catch (Exception ex) { return new SaveCategoryResponse { Success = false, Message = ex.Message }; }
        }

        public SportsMastersResponse GetSportsMasters()
        {
            var r = new SportsMastersResponse();
            try { var p = new DynamicParameters(); p.Add("@TableName","Master_SportsCertificateType"); p.Add("@DataValueField","CertificateTypeID"); p.Add("@DataTextField","CertificateType"); p.Add("@ParentField",""); p.Add("@ParentFieldValue",""); p.Add("@OrderByFields","SeqNo"); var dt = _db.GetDataTable("Base_GetMasterTableList", p); if (dt != null) foreach (System.Data.DataRow row in dt.Rows) { var v = row[0].ToString()!; if (v != "-1") r.CertificateTypes.Add(new DropdownItem { Value = v, Text = row[1].ToString()! }); } } catch { }
            return r;
        }

        public SportsDetailsResponse GetSportsDetails(long candidateId, string userLoginId)
        {
            var r = new SportsDetailsResponse();
            try { var p = new DynamicParameters(); p.Add("@CandidateID", candidateId); p.Add("@UserLoginID", userLoginId); p.Add("@PageCode","SportsDetails"); var dt = _db.GetDataTable("ApplicationForm_GetSportsDetails", p); if (dt == null || dt.Rows.Count == 0) return r; var row = dt.Rows[0]; if (row["CandidateID"] == DBNull.Value || Convert.ToInt64(row["CandidateID"]) == 0) return r; r.Found = true; r.IsSportsCertificate = row["IsSportsCertificate"] != DBNull.Value && Convert.ToBoolean(row["IsSportsCertificate"]); r.CertificateTypeID = row["CertificateTypeID"] != DBNull.Value ? Convert.ToInt32(row["CertificateTypeID"]) : 0; } catch { }
            return r;
        }

        public SaveSportsResponse SaveSportsDetails(long candidateId, string userLoginId, string ipAddress, SaveSportsRequest request)
        {
            try { var p = new DynamicParameters(); p.Add("@CandidateID", candidateId); p.Add("@IsSportsCertificate", request.IsSportsCertificate); if (request.IsSportsCertificate && request.CertificateTypeID > 0) p.Add("@CertificateTypeID", request.CertificateTypeID); else p.Add("@CertificateTypeID", DBNull.Value); p.Add("@UserLoginID", userLoginId); p.Add("@IPAddress", ipAddress); p.Add("@PageCode","SportsDetails"); var result = _db.ExecuteScalar("ApplicationForm_SaveSportsDetails", p)?.ToString() ?? ""; if (result.ToUpper() == "Y") { UpdateStatus(candidateId, userLoginId, ipAddress, "SportsDetails"); SetRequiredDocuments(candidateId, userLoginId, ipAddress, "SportsDetails"); return new SaveSportsResponse { Success = true, Message = "Sports details saved successfully." }; } return new SaveSportsResponse { Success = false, Message = result.Length > 0 ? result : "Data has not been saved. Please try again." }; } catch (Exception ex) { return new SaveSportsResponse { Success = false, Message = ex.Message }; }
        }

        public AvailableOptionsResponse GetAvailableOptions(long candidateId)
        {
            var r = new AvailableOptionsResponse();
            try { var p = new DynamicParameters(); p.Add("@CandidateID", candidateId); var dt = _db.GetDataTable("ApplicationForm_GetAvailableOptionsList", p); if (dt != null) foreach (System.Data.DataRow row in dt.Rows) r.Colleges.Add(new CollegeOptionDto { CollegeID = row["CollegeID"] != DBNull.Value ? Convert.ToInt64(row["CollegeID"]) : 0, CollegeCode = row["CollegeCode"].ToString()!, CollegeName = row["CollegeName"].ToString()!, District = row["District"].ToString()!, CourseStatus = row["CourseStatus"].ToString()! }); } catch { }
            return r;
        }

        public ShortlistedOptionsResponse GetShortlistedOptions(long candidateId)
        {
            var r = new ShortlistedOptionsResponse();
            try { var p = new DynamicParameters(); p.Add("@CandidateID", candidateId); var dt = _db.GetDataTable("ApplicationForm_GetShortlistedOptionsList", p); if (dt != null) foreach (System.Data.DataRow row in dt.Rows) r.Colleges.Add(new CollegeOptionDto { CollegeID = row["CollegeID"] != DBNull.Value ? Convert.ToInt64(row["CollegeID"]) : 0, CollegeCode = row["CollegeCode"].ToString()!, CollegeName = row["CollegeName"].ToString()!, District = row["District"].ToString()!, CourseStatus = row["CourseStatus"].ToString()!, PreferenceNo = row["PreferenceNo"] != DBNull.Value ? Convert.ToInt32(row["PreferenceNo"]) : 0 }); } catch { }
            return r;
        }

        public OptionActionResponse AddOption(long candidateId, string userLoginId, string ipAddress, long collegeId)
        {
            try { var p = new DynamicParameters(); p.Add("@CandidateID", candidateId); p.Add("@CollegeID", collegeId); p.Add("@UserLoginID", userLoginId); p.Add("@IPAddress", ipAddress); p.Add("@PageCode","ShortListOptions"); var result = _db.ExecuteScalar("ApplicationForm_SaveOption", p)?.ToString() ?? ""; if (result.ToUpper() == "Y") return new OptionActionResponse { Success = true, Message = "College added successfully." }; return new OptionActionResponse { Success = false, Message = result.Length > 0 ? result : "Failed to add college." }; } catch (Exception ex) { return new OptionActionResponse { Success = false, Message = ex.Message }; }
        }

        public OptionActionResponse RemoveOption(long candidateId, string userLoginId, string ipAddress, long collegeId)
        {
            try { var p = new DynamicParameters(); p.Add("@CandidateID", candidateId); p.Add("@CollegeID", collegeId); p.Add("@UserLoginID", userLoginId); p.Add("@IPAddress", ipAddress); p.Add("@PageCode","ShortListOptions"); var result = _db.ExecuteScalar("ApplicationForm_DeleteOption", p)?.ToString() ?? ""; if (result.ToUpper() == "Y") return new OptionActionResponse { Success = true, Message = "College removed successfully." }; return new OptionActionResponse { Success = false, Message = result.Length > 0 ? result : "Failed to remove college." }; } catch (Exception ex) { return new OptionActionResponse { Success = false, Message = ex.Message }; }
        }

        public SaveShortlistResponse SaveShortlist(long candidateId, string userLoginId, string ipAddress)
        {
            try { var p = new DynamicParameters(); p.Add("@CandidateID", candidateId); p.Add("@UserLoginID", userLoginId); p.Add("@IPAddress", ipAddress); p.Add("@PageCode","ShortListOptions"); var result = _db.ExecuteScalar("ApplicationForm_SaveShortlistedOptionsDetails", p)?.ToString() ?? ""; if (result.ToUpper() == "Y") { UpdateStatus(candidateId, userLoginId, ipAddress, "ShortListOptions"); return new SaveShortlistResponse { Success = true, Message = "Shortlist saved successfully." }; } return new SaveShortlistResponse { Success = false, Message = result.Length > 0 ? result : "Failed to save shortlist." }; } catch (Exception ex) { return new SaveShortlistResponse { Success = false, Message = ex.Message }; }
        }

        public PreferencedOptionsResponse GetPreferencedOptions(long candidateId)
        {
            var r = new PreferencedOptionsResponse();
            try { var p = new DynamicParameters(); p.Add("@CandidateID", candidateId); var dt = _db.GetDataTable("ApplicationForm_GetPreferancedOptionsList", p); if (dt != null) foreach (System.Data.DataRow row in dt.Rows) r.Colleges.Add(new CollegeOptionDto { CollegeID = row["CollegeID"] != DBNull.Value ? Convert.ToInt64(row["CollegeID"]) : 0, CollegeCode = row["CollegeCode"].ToString()!, CollegeName = row["CollegeName"].ToString()!, District = row["District"].ToString()!, CourseStatus = row["CourseStatus"].ToString()!, PreferenceNo = row["PreferenceNo"] != DBNull.Value ? Convert.ToInt32(row["PreferenceNo"]) : 0 }); } catch { }
            return r;
        }

        public SavePreferencesResponse SavePreferences(long candidateId, string userLoginId, string ipAddress, SavePreferencesRequest request)
        {
            try { if (request.Options == null || request.Options.Count == 0) return new SavePreferencesResponse { Success = false, Message = "No preferences provided." }; if (request.Options.Any(o => o.PreferenceNo <= 0)) return new SavePreferencesResponse { Success = false, Message = "Please Set Preferences to All Shortlisted Colleges." }; var xml = new System.Text.StringBuilder(); xml.Append("<?xml version=\"1.0\" encoding=\"utf-16\"?><ArrayOfOptionEntity xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">"); foreach (var opt in request.Options) { xml.Append("<OptionEntity>"); xml.Append($"<PreferenceNo>{opt.PreferenceNo}</PreferenceNo>"); xml.Append($"<CollegeID>{opt.CollegeID}</CollegeID>"); xml.Append("</OptionEntity>"); } xml.Append("</ArrayOfOptionEntity>"); var p = new DynamicParameters(); p.Add("@CandidateID", candidateId); p.Add("@OptionsXML", xml.ToString()); p.Add("@UserLoginID", userLoginId); p.Add("@IPAddress", ipAddress); p.Add("@PageCode","SetPreferences"); var result = _db.ExecuteScalar("ApplicationForm_SavePreferenceDetails", p)?.ToString() ?? ""; if (result.ToUpper() == "Y") { UpdateStatus(candidateId, userLoginId, ipAddress, "SetPreferences"); return new SavePreferencesResponse { Success = true, Message = "Preferences saved successfully." }; } return new SavePreferencesResponse { Success = false, Message = result.Length > 0 ? result : "Failed to save preferences." }; } catch (Exception ex) { return new SavePreferencesResponse { Success = false, Message = ex.Message }; }
        }

        public SavePreferencesResponse ResetPreferences(long candidateId, string userLoginId, string ipAddress)
        {
            try { var gp = new DynamicParameters(); gp.Add("@CandidateID", candidateId); var dt = _db.GetDataTable("ApplicationForm_GetPreferancedOptionsList", gp); if (dt == null || dt.Rows.Count == 0) return new SavePreferencesResponse { Success = true, Message = "No preferences to reset." }; var xml = new System.Text.StringBuilder(); xml.Append("<?xml version=\"1.0\" encoding=\"utf-16\"?><ArrayOfOptionEntity xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">"); foreach (System.Data.DataRow row in dt.Rows) { xml.Append("<OptionEntity><PreferenceNo>0</PreferenceNo>"); xml.Append($"<CollegeID>{row["CollegeID"]}</CollegeID></OptionEntity>"); } xml.Append("</ArrayOfOptionEntity>"); var p = new DynamicParameters(); p.Add("@CandidateID", candidateId); p.Add("@OptionsXML", xml.ToString()); p.Add("@UserLoginID", userLoginId); p.Add("@IPAddress", ipAddress); p.Add("@PageCode","SetPreferences"); _db.ExecuteScalar("ApplicationForm_SavePreferenceDetails", p); return new SavePreferencesResponse { Success = true, Message = "Preferences reset successfully." }; } catch (Exception ex) { return new SavePreferencesResponse { Success = false, Message = ex.Message }; }
        }

        public PhotoSignDetailsResponse GetPhotoSignDetails(long candidateId, string userLoginId)
        {
            var r = new PhotoSignDetailsResponse();
            try { var p = new DynamicParameters(); p.Add("@CandidateID", candidateId); p.Add("@UserLoginID", userLoginId); p.Add("@PageCode","UploadPhotoAndSign"); var dt = _db.GetDataTable("ApplicationForm_GetPhotoAndSignDetails", p); if (dt == null || dt.Rows.Count == 0) return r; var row = dt.Rows[0]; if (row["CandidateID"] == DBNull.Value || Convert.ToInt64(row["CandidateID"]) == 0) return r; r.Found = true; r.PhotoUploadedURL = ExtractBlobUrl(row["PhotoUploadedURL"]?.ToString() ?? ""); r.SignUploadedURL = ExtractBlobUrl(row["SignUploadedURL"]?.ToString() ?? ""); r.BothUploaded = r.PhotoUploadedURL.Length > 0 && r.SignUploadedURL.Length > 0; } catch { }
            return r;
        }

        public async Task<UploadPhotoSignResponse> UploadPhoto(long candidateId, string userLoginId, string ipAddress, IFormFile file)
        {
            try { var ext = Path.GetExtension(file.FileName).ToLower(); if (ext != ".jpg" && ext != ".jpeg") return new UploadPhotoSignResponse { Success = false, Message = "Photograph Format should be jpg/jpeg." }; if (file.Length < 10240 || file.Length > 102400) return new UploadPhotoSignResponse { Success = false, Message = "Photograph Size must be greater than 10 KB and less than 100 KB." }; var url = await UploadToBlob(file, candidateId, "photograph", "p"); if (url.Length == 0) return new UploadPhotoSignResponse { Success = false, Message = "Failed to upload photograph. Please try again." }; var existingSign = (string?)null; try { var gp = new DynamicParameters(); gp.Add("@CandidateID", candidateId); gp.Add("@UserLoginID", userLoginId); gp.Add("@PageCode","UploadPhotoAndSign"); var existDt = _db.GetDataTable("ApplicationForm_GetPhotoAndSignDetails", gp); if (existDt != null && existDt.Rows.Count > 0) existingSign = existDt.Rows[0]["SignUploadedURL"]?.ToString() ?? ""; } catch { existingSign = ""; } var p = new DynamicParameters(); p.Add("@CandidateID", candidateId); p.Add("@PhotoUploadedURL", url); p.Add("@SignUploadedURL", existingSign ?? ""); p.Add("@UserLoginID", userLoginId); p.Add("@IPAddress", ipAddress); p.Add("@PageCode","UploadPhotoAndSign"); _db.ExecuteScalar("ApplicationForm_SavePhotoAndSignUploadStatus", p); return new UploadPhotoSignResponse { Success = true, Message = "Photograph Uploaded Successfully.", UploadedURL = url }; } catch (Exception ex) { return new UploadPhotoSignResponse { Success = false, Message = ex.Message }; }
        }

        public async Task<UploadPhotoSignResponse> UploadSign(long candidateId, string userLoginId, string ipAddress, IFormFile file)
        {
            try { var ext = Path.GetExtension(file.FileName).ToLower(); if (ext != ".jpg" && ext != ".jpeg") return new UploadPhotoSignResponse { Success = false, Message = "Signature Format should be jpg/jpeg." }; if (file.Length < 5120 || file.Length > 51200) return new UploadPhotoSignResponse { Success = false, Message = "Signature Size must be greater than 5 KB and less than 50 KB." }; var url = await UploadToBlob(file, candidateId, "signature", "s"); if (url.Length == 0) return new UploadPhotoSignResponse { Success = false, Message = "Failed to upload signature. Please try again." }; var existingPhoto = (string?)null; try { var gp = new DynamicParameters(); gp.Add("@CandidateID", candidateId); gp.Add("@UserLoginID", userLoginId); gp.Add("@PageCode","UploadPhotoAndSign"); var existDt = _db.GetDataTable("ApplicationForm_GetPhotoAndSignDetails", gp); if (existDt != null && existDt.Rows.Count > 0) existingPhoto = existDt.Rows[0]["PhotoUploadedURL"]?.ToString() ?? ""; } catch { existingPhoto = ""; } var p = new DynamicParameters(); p.Add("@CandidateID", candidateId); p.Add("@PhotoUploadedURL", existingPhoto ?? ""); p.Add("@SignUploadedURL", url); p.Add("@UserLoginID", userLoginId); p.Add("@IPAddress", ipAddress); p.Add("@PageCode","UploadPhotoAndSign"); _db.ExecuteScalar("ApplicationForm_SavePhotoAndSignUploadStatus", p); return new UploadPhotoSignResponse { Success = true, Message = "Signature Uploaded Successfully.", UploadedURL = url }; } catch (Exception ex) { return new UploadPhotoSignResponse { Success = false, Message = ex.Message }; }
        }

        public SavePhotoSignResponse SavePhotoSign(long candidateId, string userLoginId, string ipAddress)
        {
            try { var p = new DynamicParameters(); p.Add("@CandidateID", candidateId); p.Add("@UserLoginID", userLoginId); p.Add("@IPAddress", ipAddress); p.Add("@PageCode","UploadPhotoAndSign"); var result = _db.ExecuteScalar("ApplicationForm_SavePhotoAndSignDetails", p)?.ToString() ?? ""; if (result.ToUpper() == "Y") { UpdateStatus(candidateId, userLoginId, ipAddress, "UploadPhotoAndSign"); return new SavePhotoSignResponse { Success = true, Message = "Photo and Signature details saved successfully." }; } return new SavePhotoSignResponse { Success = false, Message = result.Length > 0 ? result : "Failed to save." }; } catch (Exception ex) { return new SavePhotoSignResponse { Success = false, Message = ex.Message }; }
        }

        private async Task<string> UploadToBlob(IFormFile file, long candidateId, string subfolder, string suffix)
        {
            var ext      = Path.GetExtension(file.FileName).ToLower();
            var guid     = Guid.NewGuid().ToString("N");
            var fileName = $"{candidateId}_{suffix}_{guid}{ext}";

            var storageConn = _config["AzureBlob:StorageConnectionString"] ?? "";
            var container   = _config["AzureBlob:FileMainContainer"]       ?? "";
            var fileProject = _config["AzureBlob:FileProject"]             ?? "";
            var storageUrl  = _config["AzureBlob:StorageURL"]              ?? "";

            if (string.IsNullOrWhiteSpace(storageConn) || !storageConn.Contains("AccountKey=") || storageConn.Contains("REPLACE_WITH"))
                throw new InvalidOperationException("Azure Blob Storage is not configured. Please set AzureBlob:StorageConnectionString in appsettings.json.");

            var blobPath = $"{fileProject}/{subfolder}/{fileName}";
            var svc      = new BlobServiceClient(storageConn);
            var cc       = svc.GetBlobContainerClient(container.ToLower());
            await cc.CreateIfNotExistsAsync();
            var bc = cc.GetBlobClient(blobPath);
            using (var ms = new MemoryStream())
            {
                await file.CopyToAsync(ms);
                ms.Position = 0;
                await bc.UploadAsync(ms, overwrite: true);
            }
            var azUrl = $"{storageUrl.TrimEnd('/')}/{container.ToLower()}/{blobPath}";
            Console.WriteLine($"[UploadToBlob] Azure → {azUrl}");
            return azUrl;
        }

        // UpdateStatus — advances StepID in ApplicationForm_Status after each page save.
        // This is what makes the dashboard progress stepper accurate.
        // Mirrors: ApplicationFormWorker.UpdateApplicationFormStatus() → ApplicationForm_UpdateStatus SP
        private void UpdateStatus(long candidateId, string userLoginId, string ipAddress, string pageCode)
        {
            try
            {
                var p = new DynamicParameters();
                p.Add("@CandidateID", candidateId);
                p.Add("@UserLoginID", userLoginId);
                p.Add("@PageCode",    pageCode);
                p.Add("@IPAddress",   ipAddress);
                _db.ExecuteNonQuery("ApplicationForm_UpdateStatus", p);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[UpdateStatus] PageCode={pageCode} Error: {ex.Message}");
                // Non-fatal — save is already done, don't fail for this
            }
        }

        // SetRequiredDocuments — rebuilds required documents list after page saves.
        // Called after Sports, Category, Qualification so sport cert / caste docs appear.
        private void SetRequiredDocuments(long candidateId, string userLoginId, string ipAddress, string pageCode)
        {
            try
            {
                var p = new DynamicParameters();
                p.Add("@CandidateID", candidateId);
                p.Add("@UserLoginID", userLoginId);
                p.Add("@PageCode",    pageCode);
                p.Add("@IPAddress",   ipAddress);
                _db.ExecuteNonQuery("ApplicationForm_SetRequiredDocuments", p);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SetRequiredDocuments] PageCode={pageCode} Error: {ex.Message}");
            }
        }

        // Strips legacy ViewFile.aspx?...FileURL=https://... wrapper at any nesting depth
        private static string ExtractBlobUrl(string url)
        {
            if (string.IsNullOrWhiteSpace(url)) return "";
            var current = url;
            while (current.Contains("ViewFile.aspx") && current.Contains("FileURL="))
            {
                var idx = current.IndexOf("FileURL=", StringComparison.OrdinalIgnoreCase);
                if (idx < 0) break;
                var extracted = Uri.UnescapeDataString(current.Substring(idx + "FileURL=".Length));
                if (extracted == current) break;
                current = extracted;
            }
            return current;
        }

        public QualificationMastersResponse GetQualificationMasters()
        {
            var r = new QualificationMastersResponse();
            try { var p = new DynamicParameters(); p.Add("@TableName","Master_Qualification"); p.Add("@DataValueField","QualificationID"); p.Add("@DataTextField","Qualification"); p.Add("@ParentField",""); p.Add("@ParentFieldValue",""); p.Add("@OrderByFields","QualificationID"); var dt = _db.GetDataTable("Base_GetMasterTableList", p); if (dt != null) foreach (System.Data.DataRow row in dt.Rows) { var v = row[0].ToString()!; if (v != "-1") r.Qualifications.Add(new DropdownItem { Value = v, Text = row[1].ToString()! }); } } catch { }
            try { var dt = _db.GetDataTable("Base_GetMasterDistrict"); if (dt != null) foreach (System.Data.DataRow row in dt.Rows) { var v = row[0].ToString()!; var g = row[2].ToString()!; if (v == "-1" || g == "-1") continue; if (g == "27") r.PassingDistricts.Add(new DropdownItem { Value = v, Text = row[1].ToString()! }); } } catch { }
            for (int y = 2026; y >= 1997; y--) r.PassingYears.Add(new DropdownItem { Value = y.ToString(), Text = y.ToString() });
            try { var p = new DynamicParameters(); p.Add("@TableName","Master_Board"); p.Add("@DataValueField","BoardID"); p.Add("@DataTextField","Board"); p.Add("@ParentField",""); p.Add("@ParentFieldValue",""); p.Add("@OrderByFields","BoardID"); var dt = _db.GetDataTable("Base_GetMasterTableList", p); if (dt != null) foreach (System.Data.DataRow row in dt.Rows) { var v = row[0].ToString()!; if (v != "-1") r.Boards.Add(new DropdownItem { Value = v, Text = row[1].ToString()! }); } } catch { }
            for (int i = 1; i <= 22; i++) r.EducationalGapYears.Add(new DropdownItem { Value = i.ToString(), Text = i.ToString() });
            for (int i = 1; i <= 10; i++) r.NoOfAttempts.Add(new DropdownItem { Value = i.ToString(), Text = i.ToString() });
            return r;
        }

        public QualificationDetailsResponse GetQualificationDetails(long candidateId, string userLoginId)
        {
            var r = new QualificationDetailsResponse();
            try { var p = new DynamicParameters(); p.Add("@CandidateID", candidateId); p.Add("@UserLoginID", userLoginId); p.Add("@PageCode","Qualification"); var dt = _db.GetDataTable("ApplicationForm_GetQualificationDetails", p); if (dt == null || dt.Rows.Count == 0) return r; var row = dt.Rows[0]; if (row["CandidateID"] == DBNull.Value || Convert.ToInt64(row["CandidateID"]) == 0) return r; r.Found = true; r.EligibilityQualification = row["EligibilityQualification"]?.ToString() ?? ""; r.EligibilityQualificationID = row["EligibilityQualificationID"] != DBNull.Value ? Convert.ToInt16(row["EligibilityQualificationID"]) : (short)0; r.HighestQualificationID = row["HighestQualificationID"] != DBNull.Value ? Convert.ToInt16(row["HighestQualificationID"]) : (short)0; r.IsEducationalGap = row["IsEducationalGap"] != DBNull.Value ? Convert.ToInt16(row["IsEducationalGap"]) : (short)0; r.EducationalGapYears = row["EducationalGapYears"] != DBNull.Value ? Convert.ToInt16(row["EducationalGapYears"]) : (short)0; r.EducationalGapReason = row["EducationalGapReason"]?.ToString() ?? ""; r.SeatNo = row["SeatNo"]?.ToString() ?? ""; r.NoOfAttempts = row["NoOfAttempts"] != DBNull.Value ? Convert.ToInt16(row["NoOfAttempts"]) : (short)0; r.PassingDistrictID = row["PassingDistrictID"] != DBNull.Value ? Convert.ToInt32(row["PassingDistrictID"]) : 0; r.PassingYear = row["PassingYear"] != DBNull.Value ? Convert.ToInt16(row["PassingYear"]) : (short)0; r.BoardID = row["BoardID"] != DBNull.Value ? Convert.ToInt16(row["BoardID"]) : (short)0; r.MarksObtained = row["MarksObtained"] != DBNull.Value ? Convert.ToInt32(row["MarksObtained"]) : 0; r.MarksOutOf = row["MarksOutOf"] != DBNull.Value ? Convert.ToInt32(row["MarksOutOf"]) : 0; r.Percentage = row["Percentage"] != DBNull.Value ? Convert.ToDecimal(row["Percentage"]) : 0; } catch { }
            return r;
        }

        public SaveQualificationResponse SaveQualificationDetails(long candidateId, string userLoginId, string ipAddress, SaveQualificationRequest request)
        {
            try { decimal pct = request.MarksOutOf > 0 ? (Convert.ToDecimal(request.MarksObtained) * 100) / request.MarksOutOf : 0; var p = new DynamicParameters(); p.Add("@CandidateID", candidateId); p.Add("@HighestQualificationID", request.HighestQualificationID); p.Add("@IsEducationalGap", request.IsEducationalGap); p.Add("@EducationalGapYears", request.EducationalGapYears); p.Add("@EducationalGapReason", request.EducationalGapReason.Trim().ToUpper()); p.Add("@EligibilityQualificationID", request.EligibilityQualificationID); p.Add("@SeatNo", request.SeatNo.Trim().ToUpper()); p.Add("@NoOfAttempts", request.NoOfAttempts); p.Add("@PassingDistrictID", request.PassingDistrictID); p.Add("@PassingYear", request.PassingYear); p.Add("@BoardID", request.BoardID); p.Add("@MarksObtained", request.MarksObtained); p.Add("@MarksOutOf", request.MarksOutOf); p.Add("@Percentage", pct); p.Add("@UserLoginID", userLoginId); p.Add("@IPAddress", ipAddress); p.Add("@PageCode","Qualification"); var result = _db.ExecuteScalar("ApplicationForm_SaveQualificationDetails", p)?.ToString() ?? ""; if (result.ToUpper() == "Y") { UpdateStatus(candidateId, userLoginId, ipAddress, "Qualification"); SetRequiredDocuments(candidateId, userLoginId, ipAddress, "Qualification"); return new SaveQualificationResponse { Success = true, Message = "Qualification details saved successfully." }; } return new SaveQualificationResponse { Success = false, Message = result.Length > 0 ? result : "Data has not been saved. Please try again." }; } catch (Exception ex) { return new SaveQualificationResponse { Success = false, Message = ex.Message }; }
        }

        public DocumentsListResponse GetDocumentsList(long candidateId, string userLoginId)
        {
            var r = new DocumentsListResponse();
            try { var p = new DynamicParameters(); p.Add("@CandidateID", candidateId); p.Add("@UserLoginID", userLoginId); p.Add("@PageCode","UploadRequiredDocuments"); var dt = _db.GetDataTable("ApplicationForm_GetRequiredDocumentsList", p); if (dt == null) return r; var noDetails = new HashSet<int> { 1, 2, 4, 14, 15, 19, 21, 24 }; bool HC(string n) => dt.Columns.Contains(n); foreach (System.Data.DataRow row in dt.Rows) { var docId = HC("DocumentID") && row["DocumentID"] != DBNull.Value ? Convert.ToInt32(row["DocumentID"]) : 0; r.Documents.Add(new RequiredDocumentDto { DocumentID = docId, DocumentName = HC("DocumentName") ? row["DocumentName"]?.ToString() ?? "" : "", IsCompulsory = HC("IsCompulsory") && row["IsCompulsory"] != DBNull.Value ? Convert.ToInt16(row["IsCompulsory"]) : (short)0, DocumentUploadedURL = HC("DocumentUploadedURL") ? row["DocumentUploadedURL"]?.ToString() ?? "" : "", FileTypesAllowed = HC("FileTypesAllowed") ? row["FileTypesAllowed"]?.ToString() ?? "pdf" : "pdf", MaxFileSizeAllowed = HC("MaxFileSizeAllowed") && row["MaxFileSizeAllowed"] != DBNull.Value ? Convert.ToInt32(row["MaxFileSizeAllowed"]) : 1024, IsAllCompulsoryDocumentsUploaded = HC("IsAllCompulsoryDocumentsUploaded") && row["IsAllCompulsoryDocumentsUploaded"] != DBNull.Value ? Convert.ToInt16(row["IsAllCompulsoryDocumentsUploaded"]) : (short)0, RequiresDocumentDetails = !noDetails.Contains(docId) }); } r.TotalMandatory = r.Documents.Count(d => d.IsCompulsory == 1); r.UploadedMandatory = r.Documents.Count(d => d.IsCompulsory == 1 && d.DocumentUploadedURL.Length > 0); r.AllCompulsoryUploaded = r.TotalMandatory == 0 || !r.Documents.Any(d => d.IsCompulsory == 1 && d.DocumentUploadedURL.Length == 0); } catch (Exception ex) { Console.WriteLine($"GetDocumentsList error: {ex.Message}"); throw; }
            return r;
        }

        public async Task<UploadDocumentResponse> UploadDocument(long candidateId, string userLoginId, string ipAddress, UploadDocumentRequest request, IFormFile file)
        {
            try { if (request.DocumentID <= 0) return new UploadDocumentResponse { Success = false, Message = "Invalid document." }; var docList = GetDocumentsList(candidateId, userLoginId); var doc = docList.Documents.FirstOrDefault(d => d.DocumentID == request.DocumentID); if (doc == null) return new UploadDocumentResponse { Success = false, Message = "Document not found." }; var ext = Path.GetExtension(file.FileName).ToLower().TrimStart('.'); var allowedArr = doc.FileTypesAllowed.ToLower().Split(new[] { ',', ' ', '.', ';' }, StringSplitOptions.RemoveEmptyEntries); if (!allowedArr.Contains(ext)) return new UploadDocumentResponse { Success = false, Message = $"Only {doc.FileTypesAllowed} files are allowed." }; if (file.Length > (long)doc.MaxFileSizeAllowed * 1024) return new UploadDocumentResponse { Success = false, Message = $"Maximum file size allowed is {doc.MaxFileSizeAllowed} KB." }; var url = await UploadToBlob(file, candidateId, "documents", $"doc{request.DocumentID}"); DateTime? issueDate = null; if (!string.IsNullOrWhiteSpace(request.DocumentIssueDate)) { if (DateTime.TryParseExact(request.DocumentIssueDate.Trim(), new[] { "dd/MM/yyyy","yyyy-MM-dd" }, System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None, out var pd)) issueDate = pd; } var p = new DynamicParameters(); p.Add("@CandidateID", candidateId); p.Add("@DocumentID", request.DocumentID); p.Add("@DocumentUploadedURL", url); p.Add("@DocumentNo", request.DocumentNo?.Trim().ToUpper() ?? ""); p.Add("@DocumentIssueDate", issueDate); p.Add("@Action","U"); p.Add("@UserLoginID", userLoginId); p.Add("@IPAddress", ipAddress); p.Add("@PageCode","UploadRequiredDocuments"); _db.ExecuteScalar("ApplicationForm_SaveRequiredDocumentUploadStatus", p); return new UploadDocumentResponse { Success = true, Message = "Document Uploaded Successfully.", UploadedURL = url }; } catch (Exception ex) { return new UploadDocumentResponse { Success = false, Message = ex.Message }; }
        }

        public DocumentActionResponse DeleteDocument(long candidateId, string userLoginId, string ipAddress, int documentId)
        {
            try { var p = new DynamicParameters(); p.Add("@CandidateID", candidateId); p.Add("@DocumentID", documentId); p.Add("@DocumentUploadedURL",""); p.Add("@DocumentNo",""); p.Add("@DocumentIssueDate",(DateTime?)null); p.Add("@Action","D"); p.Add("@UserLoginID", userLoginId); p.Add("@IPAddress", ipAddress); p.Add("@PageCode","UploadRequiredDocuments"); _db.ExecuteScalar("ApplicationForm_SaveRequiredDocumentUploadStatus", p); return new DocumentActionResponse { Success = true, Message = "Document Deleted Successfully." }; } catch (Exception ex) { return new DocumentActionResponse { Success = false, Message = ex.Message }; }
        }

        public SaveDocumentsResponse SaveDocuments(long candidateId, string userLoginId, string ipAddress)
        {
            try { var p = new DynamicParameters(); p.Add("@CandidateID", candidateId); p.Add("@UserLoginID", userLoginId); p.Add("@IPAddress", ipAddress); p.Add("@PageCode","UploadRequiredDocuments"); var result = _db.ExecuteScalar("ApplicationForm_SaveRequiredDocumentsDetails", p)?.ToString() ?? ""; if (result.ToUpper() == "Y") { UpdateStatus(candidateId, userLoginId, ipAddress, "UploadRequiredDocuments"); return new SaveDocumentsResponse { Success = true, Message = "Documents saved successfully." }; } return new SaveDocumentsResponse { Success = false, Message = result.Length > 0 ? result : "Failed to save." }; } catch (Exception ex) { return new SaveDocumentsResponse { Success = false, Message = ex.Message }; }
        }

        public FeeDetailsResponse GetFeeDetails(long candidateId, string userLoginId)
        {
            try { var p = new DynamicParameters(); p.Add("@CandidateID", candidateId); p.Add("@UserLoginID", userLoginId); p.Add("@PageCode","PayApplicationFee"); var dt = _db.GetDataTable("ApplicationForm_GetApplicationFeeDetails", p); if (dt == null || dt.Rows.Count == 0) return new FeeDetailsResponse { Success = false, Message = "Fee details not found." }; var row = dt.Rows[0]; bool HC(string n) => dt.Columns.Contains(n); var fee = new ApplicationFeeDto { CandidateID = candidateId, ApplicationID = HC("ApplicationID") ? row["ApplicationID"]?.ToString() ?? "" : "", CandidateName = HC("CandidateName") ? row["CandidateName"]?.ToString() ?? "" : "", AppliedCourse = HC("AppliedCourse") ? row["AppliedCourse"]?.ToString() ?? "" : "", Gender = HC("Gender") ? row["Gender"]?.ToString() ?? "" : "", Category = HC("Category") ? row["Category"]?.ToString() ?? "" : "", IsPWD = HC("IsPWD") ? row["IsPWD"]?.ToString() ?? "" : "", FeeToBePaid = HC("FeeToBePaid") && row["FeeToBePaid"] != DBNull.Value ? Convert.ToInt32(row["FeeToBePaid"]) : 0, FeeAlreadyPaid = HC("FeeAlreadyPaid") && row["FeeAlreadyPaid"] != DBNull.Value ? Convert.ToInt32(row["FeeAlreadyPaid"]) : 0, RemainingFee = HC("RemainingFee") && row["RemainingFee"] != DBNull.Value ? Convert.ToInt32(row["RemainingFee"]) : 0, PhaseID = HC("PhaseID") && row["PhaseID"] != DBNull.Value ? Convert.ToInt32(row["PhaseID"]) : 0, Purpose = HC("Purpose") ? row["Purpose"]?.ToString() ?? "" : "" }; try { var gwDt = _db.GetDataTable("Master_GetPaymentGateways", new DynamicParameters()); if (gwDt != null) foreach (System.Data.DataRow gw in gwDt.Rows) fee.PaymentGateways.Add(new PaymentGatewayOption { PaymentGatewayID = gw["PaymentGatewayID"] != DBNull.Value ? Convert.ToInt32(gw["PaymentGatewayID"]) : 0, PaymentGatewayName = gw["PaymentGatewayName"]?.ToString() ?? "" }); } catch { fee.PaymentGateways = new List<PaymentGatewayOption> { new() { PaymentGatewayID = 1, PaymentGatewayName = "NSDL" }, new() { PaymentGatewayID = 2, PaymentGatewayName = "BillDesk" } }; } return new FeeDetailsResponse { Success = true, Fee = fee }; } catch (Exception ex) { return new FeeDetailsResponse { Success = false, Message = ex.Message }; }
        }

        public FeeInitiateResponse InitiateFeeTransaction(long candidateId, string userLoginId, string ipAddress, int paymentGatewayId)
        {
            try { var feeDetails = GetFeeDetails(candidateId, userLoginId); if (!feeDetails.Success) return new FeeInitiateResponse { Success = false, Message = feeDetails.Message }; var phaseId = feeDetails.Fee.PhaseID; if (phaseId <= 0) return new FeeInitiateResponse { Success = false, Message = "Invalid Phase. Please refresh and try again." }; if (paymentGatewayId <= 0) return new FeeInitiateResponse { Success = false, Message = "Please select a payment gateway." }; if (feeDetails.Fee.RemainingFee <= 0) return new FeeInitiateResponse { Success = false, Message = "No remaining fee to pay." }; var p = new DynamicParameters(); p.Add("@PayeeID", candidateId); p.Add("@PhaseID", phaseId); p.Add("@PaymentGatewayID", paymentGatewayId); p.Add("@UserLoginID", userLoginId); p.Add("@IPAddress", ipAddress); var dt = _db.GetDataTable("Fee_SetFeeTransaction", p); if (dt == null || dt.Rows.Count == 0) return new FeeInitiateResponse { Success = false, Message = "Failed to initiate transaction." }; var row = dt.Rows[0]; bool HC(string n) => dt.Columns.Contains(n); var sf = HC("SuccessFlag") ? row["SuccessFlag"]?.ToString() ?? "" : ""; var em = HC("ErrorMessage") ? row["ErrorMessage"]?.ToString() ?? "" : ""; if (sf.ToUpper() != "Y") return new FeeInitiateResponse { Success = false, Message = em.Length > 0 ? em : "Transaction initiation failed." }; var txId = HC("TransactionID") && row["TransactionID"] != DBNull.Value ? Convert.ToInt64(row["TransactionID"]) : 0; var gwUrl = HC("PaymentGatewayURL") ? row["PaymentGatewayURL"]?.ToString() ?? "" : ""; if (txId <= 0) return new FeeInitiateResponse { Success = false, Message = "Invalid transaction ID returned." }; return new FeeInitiateResponse { Success = true, Message = "Transaction initiated successfully.", TransactionID = txId, PaymentGatewayURL = $"{gwUrl}?T1={txId}&T2={txId.GetHashCode()}" }; } catch (Exception ex) { return new FeeInitiateResponse { Success = false, Message = ex.Message }; }
        }

        public FeeProceedResponse SaveFeeDetails(long candidateId, string userLoginId, string ipAddress)
        {
            try { var p = new DynamicParameters(); p.Add("@CandidateID", candidateId); p.Add("@UserLoginID", userLoginId); p.Add("@IPAddress", ipAddress); p.Add("@PageCode","PayApplicationFee"); var result = _db.ExecuteScalar("ApplicationForm_SaveApplicationFeeDetails", p)?.ToString() ?? ""; if (result.ToUpper() == "Y") return new FeeProceedResponse { Success = true, Message = "Fee details saved successfully." }; return new FeeProceedResponse { Success = false, Message = result.Length > 0 ? result : "Failed to save fee details." }; } catch (Exception ex) { return new FeeProceedResponse { Success = false, Message = ex.Message }; }
        }

        // ══════════════════════════════════════════════════════════════════════
        // GET SUMMARY
        // GET /api/applicationform/summary
        // SP: ApplicationForm_GetFormSummary — returns 10-table DataSet
        //
        // Tables (0-indexed):
        //   0 = ApplicationStatusSummary (completion flags, IsEligible, FormStatus)
        //   1 = PersonalSummary
        //   2 = AddressSummary
        //   3 = CategoryAndOtherReservationSummary
        //   4 = QualificationSummary
        //   5 = SportsSummary
        //   6 = AppliedCollegesList
        //   7 = PhotoAndSignSummary
        //   8 = RequiredDocumentsList
        //   9 = ApplicationFeePaymentList
        //
        // Mirrors: ApplicationFormWorker.GetApplicationFormSummary()
        // ══════════════════════════════════════════════════════════════════════
        public ApplicationFormSummaryResponse GetApplicationFormSummary(long candidateId, string userLoginId)
        {
            var r = new ApplicationFormSummaryResponse();
            try
            {
                var p = new DynamicParameters();
                p.Add("@CandidateID", candidateId);
                p.Add("@UserLoginID", userLoginId);
                p.Add("@PageCode",    "ApplicationFormSummary");

                var ds = _db.GetDataSet("ApplicationForm_GetFormSummary", p);
                if (ds == null) return r;

                bool HasTable(int i) => ds.Tables.Count > i && ds.Tables[i].Rows.Count > 0;
                string S(System.Data.DataRow dr, string col) =>
                    ds.Tables[0].Columns.Contains(col) || dr.Table.Columns.Contains(col)
                        ? dr[col]?.ToString() ?? "" : "";
                string Val(System.Data.DataRow dr, string col) => dr.Table.Columns.Contains(col) ? dr[col]?.ToString() ?? "" : "";
                bool   B(System.Data.DataRow dr, string col)   => dr.Table.Columns.Contains(col) && dr[col] != System.DBNull.Value && Convert.ToBoolean(dr[col]);
                long   L(System.Data.DataRow dr, string col)   => dr.Table.Columns.Contains(col) && dr[col] != System.DBNull.Value ? Convert.ToInt64(dr[col]) : 0;
                int    I(System.Data.DataRow dr, string col)   => dr.Table.Columns.Contains(col) && dr[col] != System.DBNull.Value ? Convert.ToInt32(dr[col]) : 0;

                // Table 0 — status flags
                if (HasTable(0))
                {
                    var dr = ds.Tables[0].Rows[0];
                    r.Status.CandidateID                                = L(dr, "CandidateID");
                    r.Status.IsPersonalDetailsFilled                    = B(dr, "IsPersonalDetailsFilled");
                    r.Status.IsAddressDetailsFilled                     = B(dr, "IsAddressDetailsFilled");
                    r.Status.IsCategoryAndOtherReservationDetailsFilled = B(dr, "IsCategoryAndOtherReservationDetailsFilled");
                    r.Status.IsQualificationDetailsFilled               = B(dr, "IsQualificationDetailsFilled");
                    r.Status.IsSportsDetailsFilled                      = B(dr, "IsSportsDetailsFilled");
                    r.Status.IsAppliedForColleges                       = B(dr, "IsAppliedForColleges");
                    r.Status.IsPhotoAndSignUploaded                     = B(dr, "IsPhotoAndSignUploaded");
                    r.Status.IsAllCompulsoryDocumentsUploaded            = B(dr, "IsAllCompulsoryDocumentsUploaded");
                    r.Status.IsApplicationFeePaid                       = B(dr, "IsApplicationFeePaid");
                    r.Status.IsEligible                                 = B(dr, "IsEligible");
                    r.Status.ErrorMsg                                   = Val(dr, "ErrorMsg");
                    r.Status.FormStatus                                 = Val(dr, "FormStatus");
                    r.Status.StepID                                     = Val(dr, "StepID");
                    r.Status.VersionNo                                  = Val(dr, "VersionNo");
                    r.Status.LastModifiedOn                             = Val(dr, "LastModifiedOn");

                    // Mirror old project redirect logic — tell frontend where to go
                    if (r.Status.CandidateID > 0)
                    {
                        if      (!r.Status.IsPersonalDetailsFilled)                    r.RedirectTo = "/candidate/personal";
                        else if (!r.Status.IsAddressDetailsFilled)                     r.RedirectTo = "/candidate/address";
                        else if (!r.Status.IsCategoryAndOtherReservationDetailsFilled) r.RedirectTo = "/candidate/category";
                        else if (!r.Status.IsQualificationDetailsFilled)               r.RedirectTo = "/candidate/qualification";
                        else if (!r.Status.IsSportsDetailsFilled)                      r.RedirectTo = "/candidate/sports";
                        else if (!r.Status.IsAppliedForColleges)                       r.RedirectTo = "/candidate/shortlist";
                        else if (!r.Status.IsPhotoAndSignUploaded)                     r.RedirectTo = "/candidate/photo-sign";
                        else if (!r.Status.IsAllCompulsoryDocumentsUploaded)            r.RedirectTo = "/candidate/documents";
                        else if (!r.Status.IsApplicationFeePaid)                       r.RedirectTo = "/candidate/fee";
                    }
                }

                // Table 1 — personal
                if (HasTable(1))
                {
                    var dr = ds.Tables[1].Rows[0];
                    r.Personal.CandidateID       = L(dr,   "CandidateID");
                    r.Personal.ApplicationID     = Val(dr, "ApplicationID");
                    r.Personal.AppliedCourse     = Val(dr, "AppliedCourse");
                    r.Personal.CandidateName     = Val(dr, "CandidateName");
                    r.Personal.FatherName        = Val(dr, "FatherName");
                    r.Personal.MotherName        = Val(dr, "MotherName");
                    r.Personal.Gender            = Val(dr, "Gender");
                    r.Personal.DOB               = Val(dr, "DOB");
                    r.Personal.Age               = Val(dr, "Age");
                    r.Personal.MobileNo          = Val(dr, "MobileNo");
                    r.Personal.EMailID           = Val(dr, "EMailID");
                    r.Personal.IsResidentOfIndia = Val(dr, "IsResidentOfIndia");
                }

                // Table 2 — address
                if (HasTable(2))
                {
                    var dr = ds.Tables[2].Rows[0];
                    r.Address.CandidateID                  = L(dr,   "CandidateID");
                    r.Address.AddressLine1                 = Val(dr, "AddressLine1");
                    r.Address.AddressLine2                 = Val(dr, "AddressLine2");
                    r.Address.State                        = Val(dr, "State");
                    r.Address.District                     = Val(dr, "District");
                    r.Address.City                         = Val(dr, "City");
                    r.Address.Pincode                      = Val(dr, "Pincode");
                    r.Address.IsCorrAddressSameAsPermanent = B(dr,   "IsCorrAddressSameAsPermanent");
                    r.Address.CorrAddressLine1             = Val(dr, "CorrAddressLine1");
                    r.Address.CorrAddressLine2             = Val(dr, "CorrAddressLine2");
                    r.Address.CorrState                    = Val(dr, "CorrState");
                    r.Address.CorrDistrict                 = Val(dr, "CorrDistrict");
                    r.Address.CorrCity                     = Val(dr, "CorrCity");
                    r.Address.CorrPincode                  = Val(dr, "CorrPincode");
                }

                // Table 3 — category
                if (HasTable(3))
                {
                    var dr = ds.Tables[3].Rows[0];
                    r.Category.CandidateID                = L(dr,   "CandidateID");
                    r.Category.DomicileDistrict           = Val(dr, "DomicileDistrict");
                    r.Category.DomicileVillage            = Val(dr, "DomicileVillage");
                    r.Category.CategoryID                 = I(dr,   "CategoryID");
                    r.Category.Category                   = Val(dr, "Category");
                    r.Category.Caste                      = Val(dr, "Caste");
                    r.Category.FinalCategoryID            = I(dr,   "FinalCategoryID");
                    r.Category.FinalCategory              = Val(dr, "FinalCategory");
                    r.Category.HasCasteCertificate        = Val(dr, "HasCasteCertificate");
                    r.Category.HasReceiptCasteCertificate = Val(dr, "HasReceiptCasteCertificate");
                    r.Category.HasNCLCertificate          = Val(dr, "HasNCLCertificate");
                    r.Category.HasNCLReceipt              = Val(dr, "HasNCLReceipt");
                    r.Category.HasEWSCertificate          = Val(dr, "HasEWSCertificate");
                    r.Category.IsOrphan                   = Val(dr, "IsOrphan");
                    r.Category.IsPWD                      = Val(dr, "IsPWD");
                    r.Category.IsExServiceman             = Val(dr, "IsExServiceman");
                    r.Category.IsFreedomFighter           = Val(dr, "IsFreedomFighter");
                    r.Category.IsProjectAffected          = Val(dr, "IsProjectAffected");
                    r.Category.IsNCC                      = Val(dr, "IsNCC");
                    r.Category.IsSports                   = Val(dr, "IsSports");
                    r.Category.IsMPKVEmployee             = Val(dr, "IsMPKVEmployee");
                    r.Category.IsLandlessFarmLabourer     = Val(dr, "IsLandlessFarmLabourer");
                    r.Category.IsIncomeSourceAgriculture  = Val(dr, "IsIncomeSourceAgriculture");
                    r.Category.HasFarm                    = Val(dr, "HasFarm");
                }

                // Table 4 — qualification
                if (HasTable(4))
                {
                    var dr = ds.Tables[4].Rows[0];
                    r.Qualification.CandidateID              = L(dr,   "CandidateID");
                    r.Qualification.HighestQualification     = Val(dr, "HighestQualification");
                    r.Qualification.IsEducationalGap         = Val(dr, "IsEducationalGap");
                    r.Qualification.EducationalGapYears      = Val(dr, "EducationalGapYears");
                    r.Qualification.EducationalGapReason     = Val(dr, "EducationalGapReason");
                    r.Qualification.EligibilityQualification = Val(dr, "EligibilityQualification");
                    r.Qualification.SeatNo                   = Val(dr, "SeatNo");
                    r.Qualification.NoOfAttempts             = Val(dr, "NoOfAttempts");
                    r.Qualification.PassingDistrict          = Val(dr, "PassingDistrict");
                    r.Qualification.PassingYear              = Val(dr, "PassingYear");
                    r.Qualification.Board                    = Val(dr, "Board");
                    r.Qualification.MarksObtained            = Val(dr, "MarksObtained");
                    r.Qualification.MarksOutOf               = Val(dr, "MarksOutOf");
                    r.Qualification.Percentage               = Val(dr, "Percentage");
                }

                // Table 5 — sports
                if (HasTable(5))
                {
                    var dr = ds.Tables[5].Rows[0];
                    r.Sports.CandidateID         = L(dr,   "CandidateID");
                    r.Sports.IsSportsCertificate  = Val(dr, "IsSportsCertificate");
                    r.Sports.CertificateType      = Val(dr, "CertificateType");
                }

                // Table 6 — applied colleges list
                if (HasTable(6))
                    foreach (System.Data.DataRow dr in ds.Tables[6].Rows)
                        r.AppliedColleges.Add(new AppliedCollegeSummary
                        {
                            CandidateID  = L(dr,   "CandidateID"),
                            PreferenceNo = Val(dr, "PreferenceNo"),
                            CollegeCode  = Val(dr, "CollegeCode"),
                            CollegeName  = Val(dr, "CollegeName"),
                            District     = Val(dr, "District"),
                            CourseStatus = Val(dr, "CourseStatus"),
                        });

                // Table 7 — photo & sign URLs
                if (HasTable(7))
                {
                    var dr = ds.Tables[7].Rows[0];
                    r.PhotoSign.CandidateID      = L(dr,   "CandidateID");
                    r.PhotoSign.PhotoUploadedURL  = ExtractBlobUrl(Val(dr, "PhotoUploadedURL"));
                    r.PhotoSign.SignUploadedURL   = ExtractBlobUrl(Val(dr, "SignUploadedURL"));
                }

                // Table 8 — required documents
                if (HasTable(8))
                    foreach (System.Data.DataRow dr in ds.Tables[8].Rows)
                        r.Documents.Add(new RequiredDocumentSummary
                        {
                            DocumentID                   = Val(dr, "DocumentID"),
                            DocumentName                 = Val(dr, "DocumentName"),
                            IsDocumentCompulsory         = Val(dr, "IsDocumentCompulsory"),
                            IsDocumentUploaded           = Val(dr, "IsDocumentUploaded"),
                            DocumentUploadedURL          = ExtractBlobUrl(Val(dr, "DocumentUploadedURL")),
                            DocumentVerificationStatus   = Val(dr, "DocumentVerificationStatus"),
                            DocumentVerificationComments = Val(dr, "DocumentVerificationComments"),
                            DocumentVerificationDate     = Val(dr, "DocumentVerificationDate"),
                        });

                // Table 9 — fee payments
                if (HasTable(9))
                    foreach (System.Data.DataRow dr in ds.Tables[9].Rows)
                        r.FeePayments.Add(new ApplicationFeeSummary
                        {
                            TransactionID   = Val(dr, "TransactionID"),
                            FeeAmount       = Val(dr, "FeeAmount"),
                            TransactionDate = Val(dr, "TransactionDate"),
                            PaymentDate     = Val(dr, "PaymentDate"),
                            BankReferenceNo = Val(dr, "BankReferenceNo"),
                            Purpose         = Val(dr, "Purpose"),
                            PaidStatus      = Val(dr, "PaidStatus"),
                        });

                r.Success = true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GetApplicationFormSummary] Error: {ex.Message}");
                r.Success = false;
                r.Message = ex.Message;
            }
            return r;
        }

        // ══════════════════════════════════════════════════════════════════════
        // LOCK FORM
        // POST /api/applicationform/summary/lock
        // SP: ApplicationForm_LockForm
        // Mirrors: ApplicationFormWorker.LockApplicationForm()
        // Returns "Y" on success → navigate to dashboard
        // ══════════════════════════════════════════════════════════════════════
        public LockFormResponse LockApplicationForm(long candidateId, string userLoginId, string ipAddress)
        {
            try
            {
                var p = new DynamicParameters();
                p.Add("@CandidateID", candidateId);
                p.Add("@UserLoginID", userLoginId);
                p.Add("@IPAddress",   ipAddress);
                p.Add("@PageCode",    "ApplicationFormSummary");

                var result = _db.ExecuteScalar("ApplicationForm_LockForm", p)?.ToString() ?? "";
                if (result.ToUpper() == "Y")
                    return new LockFormResponse { Success = true, Message = "Application Form locked successfully." };

                return new LockFormResponse
                {
                    Success = false,
                    Message = result.Length > 0 ? result : "Failed to lock form. Please try again."
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[LockApplicationForm] Error: {ex.Message}");
                return new LockFormResponse { Success = false, Message = ex.Message };
            }
        }
        // ══════════════════════════════════════════════════════════════════════
        // GET UNLOCK ELIGIBILITY
        // GET /api/applicationform/unlock/eligibility
        // SP: ApplicationForm_GetEligibilityFlagForUnlockForm
        // Mirrors: ApplicationFormWorker.GetEligibilityFlagForUnlockApplicationForm()
        // Returns IsApplicationFormUnlockAllowed + ReasonForApplicationFormUnlockNotAllowed
        // ══════════════════════════════════════════════════════════════════════
        public UnlockEligibilityResponse GetUnlockEligibility(long candidateId, string userLoginId)
        {
            try
            {
                var p = new DynamicParameters();
                p.Add("@CandidateID", candidateId);
                p.Add("@UserLoginID", userLoginId);
                var dt = _db.GetDataTable("ApplicationForm_GetEligibilityFlagForUnlockForm", p);
                if (dt == null || dt.Rows.Count == 0)
                    return new UnlockEligibilityResponse { IsAllowed = false, Reason = "Not Eligible to Unlock Application Form." };
                var row = dt.Rows[0];
                bool allowed = dt.Columns.Contains("IsApplicationFormUnlockAllowed")
                    && row["IsApplicationFormUnlockAllowed"] != DBNull.Value
                    && Convert.ToBoolean(row["IsApplicationFormUnlockAllowed"]);
                string reason = dt.Columns.Contains("ReasonForApplicationFormUnlockNotAllowed")
                    ? row["ReasonForApplicationFormUnlockNotAllowed"]?.ToString() ?? ""
                    : "";
                return new UnlockEligibilityResponse { IsAllowed = allowed, Reason = reason };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GetUnlockEligibility] Error: {ex.Message}");
                return new UnlockEligibilityResponse { IsAllowed = false, Reason = ex.Message };
            }
        }

        // ══════════════════════════════════════════════════════════════════════
        // UNLOCK FORM
        // POST /api/applicationform/unlock
        // SP: ApplicationForm_UnlockForm
        // Mirrors: ApplicationFormWorker.UnlockApplicationForm() → returns "Y" on success
        // On success → candidate navigates to /candidate/summary (same as old redirect)
        // ══════════════════════════════════════════════════════════════════════
        public LockFormResponse UnlockApplicationForm(long candidateId, string userLoginId, string ipAddress)
        {
            try
            {
                var p = new DynamicParameters();
                p.Add("@CandidateID", candidateId);
                p.Add("@UserLoginID", userLoginId);
                p.Add("@IPAddress",   ipAddress);
                p.Add("@PageCode",    "ApplicationFormUnlock");
                var result = _db.ExecuteScalar("ApplicationForm_UnlockForm", p)?.ToString() ?? "";
                if (result.ToUpper() == "Y")
                    return new LockFormResponse { Success = true, Message = "Application Form unlocked successfully." };
                return new LockFormResponse { Success = false, Message = result.Length > 0 ? result : "Failed to unlock. Please try again." };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[UnlockApplicationForm] Error: {ex.Message}");
                return new LockFormResponse { Success = false, Message = ex.Message };
            }
        }
    }
}
