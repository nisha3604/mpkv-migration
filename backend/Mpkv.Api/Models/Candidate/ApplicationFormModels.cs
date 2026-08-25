namespace Mpkv.Api.Models.Candidate
{
    public class PersonalMastersResponse { public List<DropdownItem> Courses { get; set; } = new(); public List<DropdownItem> Genders { get; set; } = new(); }
    public class PersonalDetailsResponse { public bool Found { get; set; } public long CandidateID { get; set; } public string ApplicationID { get; set; } = string.Empty; public int AppliedCourseID { get; set; } public string CandidateName { get; set; } = string.Empty; public string FatherName { get; set; } = string.Empty; public string MotherName { get; set; } = string.Empty; public string GenderCode { get; set; } = string.Empty; public string DOB { get; set; } = string.Empty; public string Age { get; set; } = string.Empty; public string MobileNo { get; set; } = string.Empty; public string EmailID { get; set; } = string.Empty; public short IsResidentOfIndia { get; set; } = 1; }
    public class SavePersonalRequest { public int AppliedCourseID { get; set; } public string CandidateName { get; set; } = string.Empty; public string FatherName { get; set; } = string.Empty; public string MotherName { get; set; } = string.Empty; public string GenderCode { get; set; } = string.Empty; public string DOB { get; set; } = string.Empty; public string MobileNo { get; set; } = string.Empty; public string EmailID { get; set; } = string.Empty; public short IsResidentOfIndia { get; set; } = 1; }
    public class SavePersonalResponse { public bool Success { get; set; } public string Message { get; set; } = string.Empty; }
    public class AddressMastersResponse { public List<DropdownItem> States { get; set; } = new(); public List<DropdownItemGrouped> Districts { get; set; } = new(); }
    public class DropdownItemGrouped { public string Value { get; set; } = string.Empty; public string Text { get; set; } = string.Empty; public string Group { get; set; } = string.Empty; }
    public class AddressDetailsResponse { public bool Found { get; set; } public string AddressLine1 { get; set; } = string.Empty; public string AddressLine2 { get; set; } = string.Empty; public int StateID { get; set; } = 27; public int DistrictID { get; set; } public string City { get; set; } = string.Empty; public string Pincode { get; set; } = string.Empty; public bool IsCorrAddressSameAsPermanent { get; set; } public string CorrAddressLine1 { get; set; } = string.Empty; public string CorrAddressLine2 { get; set; } = string.Empty; public int CorrStateID { get; set; } = 27; public int CorrDistrictID { get; set; } public string CorrCity { get; set; } = string.Empty; public string CorrPincode { get; set; } = string.Empty; }
    public class SaveAddressRequest { public string AddressLine1 { get; set; } = string.Empty; public string AddressLine2 { get; set; } = string.Empty; public int StateID { get; set; } public int DistrictID { get; set; } public string City { get; set; } = string.Empty; public string Pincode { get; set; } = string.Empty; public bool IsCorrAddressSameAsPermanent { get; set; } public string CorrAddressLine1 { get; set; } = string.Empty; public string CorrAddressLine2 { get; set; } = string.Empty; public int CorrStateID { get; set; } public int CorrDistrictID { get; set; } public string CorrCity { get; set; } = string.Empty; public string CorrPincode { get; set; } = string.Empty; }
    public class SaveAddressResponse { public bool Success { get; set; } public string Message { get; set; } = string.Empty; }
    public class CategoryMastersResponse { public List<DropdownItem> DomicileDistricts { get; set; } = new(); public List<DropdownItem> Categories { get; set; } = new(); }
    public class CategoryDetailsResponse { public bool Found { get; set; } public int DomicileDistrictID { get; set; } public string DomicileVillage { get; set; } = string.Empty; public int CategoryID { get; set; } public string Caste { get; set; } = string.Empty; public short HasCasteCertificate { get; set; } public short HasReceiptCasteCertificate { get; set; } public short HasNCLCertificate { get; set; } public short HasNCLReceipt { get; set; } public short HasEWSCertificate { get; set; } public short IsOrphan { get; set; } public short IsPWD { get; set; } public short IsExServiceman { get; set; } public short IsFreedomFighter { get; set; } public short IsProjectAffected { get; set; } public short IsNCC { get; set; } public short IsSports { get; set; } public short IsMPKVEmployee { get; set; } public short IsLandlessFarmLabourer { get; set; } public short IsIncomeSourceAgriculture { get; set; } public short HasFarm { get; set; } }
    public class SaveCategoryRequest { public int DomicileDistrictID { get; set; } public string DomicileVillage { get; set; } = string.Empty; public int CategoryID { get; set; } public int FinalCategoryID { get; set; } public string Caste { get; set; } = string.Empty; public short HasCasteCertificate { get; set; } public short HasReceiptCasteCertificate { get; set; } public short HasNCLCertificate { get; set; } public short HasNCLReceipt { get; set; } public short HasEWSCertificate { get; set; } public short IsOrphan { get; set; } public short IsPWD { get; set; } public short IsExServiceman { get; set; } public short IsFreedomFighter { get; set; } public short IsProjectAffected { get; set; } public short IsNCC { get; set; } public short IsSports { get; set; } public short IsMPKVEmployee { get; set; } public short IsLandlessFarmLabourer { get; set; } public short IsIncomeSourceAgriculture { get; set; } public short HasFarm { get; set; } }
    public class SaveCategoryResponse { public bool Success { get; set; } public string Message { get; set; } = string.Empty; }
    public class SportsMastersResponse { public List<DropdownItem> CertificateTypes { get; set; } = new(); }
    public class SportsDetailsResponse { public bool Found { get; set; } public bool IsSportsCertificate { get; set; } public int CertificateTypeID { get; set; } }
    public class SaveSportsRequest { public bool IsSportsCertificate { get; set; } public int CertificateTypeID { get; set; } }
    public class SaveSportsResponse { public bool Success { get; set; } public string Message { get; set; } = string.Empty; }
    public class CollegeOptionDto { public long CollegeID { get; set; } public string CollegeCode { get; set; } = string.Empty; public string CollegeName { get; set; } = string.Empty; public string District { get; set; } = string.Empty; public string CourseStatus { get; set; } = string.Empty; public int PreferenceNo { get; set; } }
    public class AvailableOptionsResponse { public List<CollegeOptionDto> Colleges { get; set; } = new(); }
    public class ShortlistedOptionsResponse { public List<CollegeOptionDto> Colleges { get; set; } = new(); }
    public class AddOptionRequest { public long CollegeID { get; set; } }
    public class RemoveOptionRequest { public long CollegeID { get; set; } }
    public class OptionActionResponse { public bool Success { get; set; } public string Message { get; set; } = string.Empty; public string CollegeName { get; set; } = string.Empty; }
    public class SaveShortlistResponse { public bool Success { get; set; } public string Message { get; set; } = string.Empty; }
    public class PreferencedOptionsResponse { public List<CollegeOptionDto> Colleges { get; set; } = new(); }
    public class PreferenceItem { public long CollegeID { get; set; } public int PreferenceNo { get; set; } }
    public class SavePreferencesRequest { public List<PreferenceItem> Options { get; set; } = new(); }
    public class SavePreferencesResponse { public bool Success { get; set; } public string Message { get; set; } = string.Empty; }
    public class PhotoSignDetailsResponse { public bool Found { get; set; } public string PhotoUploadedURL { get; set; } = string.Empty; public string SignUploadedURL { get; set; } = string.Empty; public bool BothUploaded { get; set; } }
    public class UploadPhotoSignResponse { public bool Success { get; set; } public string Message { get; set; } = string.Empty; public string UploadedURL { get; set; } = string.Empty; }
    public class SavePhotoSignResponse { public bool Success { get; set; } public string Message { get; set; } = string.Empty; }
    public class QualificationMastersResponse { public List<DropdownItem> Qualifications { get; set; } = new(); public List<DropdownItem> PassingDistricts { get; set; } = new(); public List<DropdownItem> PassingYears { get; set; } = new(); public List<DropdownItem> Boards { get; set; } = new(); public List<DropdownItem> EducationalGapYears { get; set; } = new(); public List<DropdownItem> NoOfAttempts { get; set; } = new(); }
    public class QualificationDetailsResponse { public bool Found { get; set; } public string EligibilityQualification { get; set; } = string.Empty; public short EligibilityQualificationID { get; set; } public short HighestQualificationID { get; set; } public short IsEducationalGap { get; set; } public short EducationalGapYears { get; set; } public string EducationalGapReason { get; set; } = string.Empty; public string SeatNo { get; set; } = string.Empty; public short NoOfAttempts { get; set; } public int PassingDistrictID { get; set; } public short PassingYear { get; set; } public short BoardID { get; set; } public int MarksObtained { get; set; } public int MarksOutOf { get; set; } public decimal Percentage { get; set; } }
    public class SaveQualificationRequest { public short HighestQualificationID { get; set; } public short IsEducationalGap { get; set; } public short EducationalGapYears { get; set; } public string EducationalGapReason { get; set; } = string.Empty; public short EligibilityQualificationID { get; set; } public string SeatNo { get; set; } = string.Empty; public short NoOfAttempts { get; set; } public int PassingDistrictID { get; set; } public short PassingYear { get; set; } public short BoardID { get; set; } public int MarksObtained { get; set; } public int MarksOutOf { get; set; } }
    public class SaveQualificationResponse { public bool Success { get; set; } public string Message { get; set; } = string.Empty; }
    public class RequiredDocumentDto { public int DocumentID { get; set; } public string DocumentName { get; set; } = string.Empty; public short IsCompulsory { get; set; } public string DocumentUploadedURL { get; set; } = string.Empty; public string FileTypesAllowed { get; set; } = string.Empty; public int MaxFileSizeAllowed { get; set; } public short IsAllCompulsoryDocumentsUploaded { get; set; } public bool RequiresDocumentDetails { get; set; } }
    public class DocumentsListResponse { public List<RequiredDocumentDto> Documents { get; set; } = new(); public int TotalMandatory { get; set; } public int UploadedMandatory { get; set; } public bool AllCompulsoryUploaded { get; set; } }
    public class UploadDocumentRequest { public int DocumentID { get; set; } public string DocumentNo { get; set; } = string.Empty; public string DocumentIssueDate { get; set; } = string.Empty; }
    public class UploadDocumentResponse { public bool Success { get; set; } public string Message { get; set; } = string.Empty; public string UploadedURL { get; set; } = string.Empty; }
    public class DeleteDocumentRequest { public int DocumentID { get; set; } }
    public class DocumentActionResponse { public bool Success { get; set; } public string Message { get; set; } = string.Empty; }
    public class SaveDocumentsResponse { public bool Success { get; set; } public string Message { get; set; } = string.Empty; }
    public class ApplicationFeeDto { public long CandidateID { get; set; } public string ApplicationID { get; set; } = string.Empty; public string CandidateName { get; set; } = string.Empty; public string AppliedCourse { get; set; } = string.Empty; public string Gender { get; set; } = string.Empty; public string Category { get; set; } = string.Empty; public string IsPWD { get; set; } = string.Empty; public int FeeToBePaid { get; set; } public int FeeAlreadyPaid { get; set; } public int RemainingFee { get; set; } public int PhaseID { get; set; } public string Purpose { get; set; } = string.Empty; public List<PaymentGatewayOption> PaymentGateways { get; set; } = new(); }
    public class PaymentGatewayOption { public int PaymentGatewayID { get; set; } public string PaymentGatewayName { get; set; } = string.Empty; }
    public class FeeDetailsResponse { public bool Success { get; set; } public string Message { get; set; } = string.Empty; public ApplicationFeeDto Fee { get; set; } = new(); }
    public class FeeInitiateRequest { public int PaymentGatewayID { get; set; } }
    public class FeeInitiateResponse { public bool Success { get; set; } public string Message { get; set; } = string.Empty; public long TransactionID { get; set; } public string PaymentGatewayURL { get; set; } = string.Empty; }
    public class FeeProceedResponse { public bool Success { get; set; } public string Message { get; set; } = string.Empty; }

    // Fee transaction models (same as FeeModels — kept in Candidate namespace for service compatibility)
    public class FeeTransactionEntity { public long TransactionID { get; set; } public string AppliedCourse { get; set; } = string.Empty; public int PhaseID { get; set; } public string Purpose { get; set; } = string.Empty; public long PayeeID { get; set; } public string PayeeApplicationID { get; set; } = string.Empty; public string PayeeName { get; set; } = string.Empty; public string PayeeMobileNo { get; set; } = string.Empty; public string PayeeEMailID { get; set; } = string.Empty; public decimal FeeAmount { get; set; } public decimal ServiceCharge { get; set; } public decimal TotalAmount { get; set; } public string PaymentGateway { get; set; } = string.Empty; public bool IsValid { get; set; } public bool IsPaid { get; set; } public string TransactionDate { get; set; } = string.Empty; public string LastPaymentDate { get; set; } = string.Empty; public string BankRefereneceNo { get; set; } = string.Empty; public string PayGateID { get; set; } = string.Empty; public string PaymentDate { get; set; } = string.Empty; public string TransactionResponse { get; set; } = string.Empty; public string Optional1 { get; set; } = string.Empty; public string Optional2 { get; set; } = string.Empty; public string Optional3 { get; set; } = string.Empty; public string Optional4 { get; set; } = string.Empty; public string Optional5 { get; set; } = string.Empty; public bool IsRefundInitiated { get; set; } public bool IsRefunded { get; set; } public bool IsChargeBackAccepted { get; set; } public bool IsPushResponse { get; set; } public bool IsMainTransaction { get; set; } public bool IsReconciled { get; set; } public string PaymentDoneBy { get; set; } = string.Empty; public string ReceiptURL { get; set; } = string.Empty; public string TransactionStatus { get; set; } = string.Empty; public string ErrorMessage { get; set; } = string.Empty; public string PaymentGatewayResponse { get; set; } = string.Empty; public string IPAddress { get; set; } = string.Empty; public string UserLoginId { get; set; } = string.Empty; }
    public class FeeResponseEntity { public long TransactionID { get; set; } public int FeeAmount { get; set; } public string BankReferenceNo { get; set; } = string.Empty; public string PaymentGatewayURL { get; set; } = string.Empty; public string SuccessFlag { get; set; } = string.Empty; public string ErrorMessage { get; set; } = string.Empty; public bool IsPaid { get; set; } }
    public class BillDeskTransactionResponse { public string mercid { get; set; } = string.Empty; public string transaction_date { get; set; } = string.Empty; public string surcharge { get; set; } = string.Empty; public string payment_method_type { get; set; } = string.Empty; public string amount { get; set; } = string.Empty; public string ru { get; set; } = string.Empty; public string orderid { get; set; } = string.Empty; public string transaction_error_type { get; set; } = string.Empty; public string discount { get; set; } = string.Empty; public string transactionid { get; set; } = string.Empty; public string txn_process_type { get; set; } = string.Empty; public string bankid { get; set; } = string.Empty; public string itemcode { get; set; } = string.Empty; public string transaction_error_code { get; set; } = string.Empty; public string transaction_error_desc { get; set; } = string.Empty; public string currency { get; set; } = string.Empty; public string auth_status { get; set; } = string.Empty; public string objectid { get; set; } = string.Empty; public string charge_amount { get; set; } = string.Empty; }
    public class PaymentSuccessInfo { public bool Success { get; set; } public string Message { get; set; } = string.Empty; public long TransactionID { get; set; } public string BankReferenceNo { get; set; } = string.Empty; public string FeeAmount { get; set; } = string.Empty; public string RedirectUrl { get; set; } = string.Empty; }
    public class PaymentFailedInfo { public bool Success { get; set; } public string Message { get; set; } = string.Empty; public string FailedMessage { get; set; } = string.Empty; public string RedirectUrl { get; set; } = string.Empty; }
}

// ── APPLICATION FORM SUMMARY ─────────────────────────────────────────────────
// Mirrors ApplicationFormSummaryEntity — one model per DataSet table returned
// by SP: ApplicationForm_GetFormSummary

public class ApplicationStatusSummary
{
    public long   CandidateID                                  { get; set; }
    public bool   IsPersonalDetailsFilled                      { get; set; }
    public bool   IsAddressDetailsFilled                       { get; set; }
    public bool   IsCategoryAndOtherReservationDetailsFilled   { get; set; }
    public bool   IsQualificationDetailsFilled                 { get; set; }
    public bool   IsSportsDetailsFilled                        { get; set; }
    public bool   IsAppliedForColleges                         { get; set; }
    public bool   IsPhotoAndSignUploaded                       { get; set; }
    public bool   IsAllCompulsoryDocumentsUploaded             { get; set; }
    public bool   IsApplicationFeePaid                         { get; set; }
    public bool   IsEligible                                   { get; set; }
    public string ErrorMsg                                     { get; set; } = "";
    public string FormStatus                                   { get; set; } = "";
    public string StepID                                       { get; set; } = "";
    public string VersionNo                                    { get; set; } = "";
    public string LastModifiedOn                               { get; set; } = "";
}

public class PersonalSummary
{
    public long   CandidateID        { get; set; }
    public string ApplicationID      { get; set; } = "";
    public string AppliedCourse      { get; set; } = "";
    public string CandidateName      { get; set; } = "";
    public string FatherName         { get; set; } = "";
    public string MotherName         { get; set; } = "";
    public string Gender             { get; set; } = "";
    public string DOB                { get; set; } = "";
    public string Age                { get; set; } = "";
    public string MobileNo           { get; set; } = "";
    public string EMailID            { get; set; } = "";
    public string IsResidentOfIndia  { get; set; } = "";
}

public class AddressSummary
{
    public long   CandidateID                  { get; set; }
    public string AddressLine1                 { get; set; } = "";
    public string AddressLine2                 { get; set; } = "";
    public string State                        { get; set; } = "";
    public string District                     { get; set; } = "";
    public string City                         { get; set; } = "";
    public string Pincode                      { get; set; } = "";
    public bool   IsCorrAddressSameAsPermanent { get; set; }
    public string CorrAddressLine1             { get; set; } = "";
    public string CorrAddressLine2             { get; set; } = "";
    public string CorrState                    { get; set; } = "";
    public string CorrDistrict                 { get; set; } = "";
    public string CorrCity                     { get; set; } = "";
    public string CorrPincode                  { get; set; } = "";
}

public class CategorySummary
{
    public long   CandidateID                { get; set; }
    public string DomicileDistrict           { get; set; } = "";
    public string DomicileVillage            { get; set; } = "";
    public int    CategoryID                 { get; set; }
    public string Category                   { get; set; } = "";
    public string Caste                      { get; set; } = "";
    public int    FinalCategoryID            { get; set; }
    public string FinalCategory              { get; set; } = "";
    public string HasCasteCertificate        { get; set; } = "";
    public string HasReceiptCasteCertificate { get; set; } = "";
    public string HasNCLCertificate          { get; set; } = "";
    public string HasNCLReceipt              { get; set; } = "";
    public string HasEWSCertificate          { get; set; } = "";
    public string IsOrphan                   { get; set; } = "";
    public string IsPWD                      { get; set; } = "";
    public string IsExServiceman             { get; set; } = "";
    public string IsFreedomFighter           { get; set; } = "";
    public string IsProjectAffected          { get; set; } = "";
    public string IsNCC                      { get; set; } = "";
    public string IsSports                   { get; set; } = "";
    public string IsMPKVEmployee             { get; set; } = "";
    public string IsLandlessFarmLabourer     { get; set; } = "";
    public string IsIncomeSourceAgriculture  { get; set; } = "";
    public string HasFarm                    { get; set; } = "";
}

public class QualificationSummary
{
    public long   CandidateID              { get; set; }
    public string HighestQualification     { get; set; } = "";
    public string IsEducationalGap         { get; set; } = "";
    public string EducationalGapYears      { get; set; } = "";
    public string EducationalGapReason     { get; set; } = "";
    public string EligibilityQualification { get; set; } = "";
    public string SeatNo                   { get; set; } = "";
    public string NoOfAttempts             { get; set; } = "";
    public string PassingDistrict          { get; set; } = "";
    public string PassingYear              { get; set; } = "";
    public string Board                    { get; set; } = "";
    public string MarksObtained            { get; set; } = "";
    public string MarksOutOf               { get; set; } = "";
    public string Percentage               { get; set; } = "";
}

public class SportsSummary
{
    public long   CandidateID        { get; set; }
    public string IsSportsCertificate { get; set; } = "";
    public string CertificateType    { get; set; } = "";
}

public class AppliedCollegeSummary
{
    public long   CandidateID  { get; set; }
    public string PreferenceNo { get; set; } = "";
    public string CollegeCode  { get; set; } = "";
    public string CollegeName  { get; set; } = "";
    public string District     { get; set; } = "";
    public string CourseStatus { get; set; } = "";
}

public class PhotoSignSummary
{
    public long   CandidateID      { get; set; }
    public string PhotoUploadedURL { get; set; } = "";
    public string SignUploadedURL  { get; set; } = "";
}

public class RequiredDocumentSummary
{
    public string DocumentID                    { get; set; } = "";
    public string DocumentName                  { get; set; } = "";
    public string IsDocumentCompulsory          { get; set; } = "";
    public string IsDocumentUploaded            { get; set; } = "";
    public string DocumentUploadedURL           { get; set; } = "";
    public string DocumentVerificationStatus    { get; set; } = "";
    public string DocumentVerificationComments  { get; set; } = "";
    public string DocumentVerificationDate      { get; set; } = "";
}

public class ApplicationFeeSummary
{
    public string TransactionID   { get; set; } = "";
    public string FeeAmount       { get; set; } = "";
    public string TransactionDate { get; set; } = "";
    public string PaymentDate     { get; set; } = "";
    public string BankReferenceNo { get; set; } = "";
    public string Purpose         { get; set; } = "";
    public string PaidStatus      { get; set; } = "";
}

public class ApplicationFormSummaryResponse
{
    public bool                         Success          { get; set; }
    public string                       Message          { get; set; } = "";
    public string?                      RedirectTo       { get; set; }   // non-null = frontend must navigate there
    public ApplicationStatusSummary     Status           { get; set; } = new();
    public PersonalSummary              Personal         { get; set; } = new();
    public AddressSummary               Address          { get; set; } = new();
    public CategorySummary              Category         { get; set; } = new();
    public QualificationSummary         Qualification    { get; set; } = new();
    public SportsSummary                Sports           { get; set; } = new();
    public List<AppliedCollegeSummary>  AppliedColleges  { get; set; } = new();
    public PhotoSignSummary             PhotoSign        { get; set; } = new();
    public List<RequiredDocumentSummary> Documents       { get; set; } = new();
    public List<ApplicationFeeSummary>  FeePayments      { get; set; } = new();
}

public class UnlockEligibilityResponse
{
    public bool   IsAllowed { get; set; }
    public string Reason    { get; set; } = "";
    public string Message   { get; set; } = "";
}

public class LockFormResponse
{
    public bool   Success { get; set; }
    public string Message { get; set; } = "";
}

// ── Payment Transaction History ───────────────────────────────────────────────
public class PaymentTransactionDto
{
    public string TransactionID       { get; set; } = "";
    public string Purpose             { get; set; } = "";
    public string FeeAmount           { get; set; } = "";
    public string ServiceCharge       { get; set; } = "";
    public string TotalAmount         { get; set; } = "";
    public string PaymentGateway      { get; set; } = "";
    public string TransactionDate     { get; set; } = "";
    public string PaymentDate         { get; set; } = "";
    public string BankReferenceNo     { get; set; } = "";
    public string TransactionResponse { get; set; } = "";
    public string TransactionStatus   { get; set; } = "";
    public bool   IsPaid              { get; set; }
    public string ApplicationID       { get; set; } = "";
    public string CandidateName       { get; set; } = "";
    public string AppliedCourse       { get; set; } = "";
}

public class PaymentHistoryResponse
{
    public List<PaymentTransactionDto> PaidTransactions   { get; set; } = new();
    public List<PaymentTransactionDto> FailedTransactions { get; set; } = new();
}
