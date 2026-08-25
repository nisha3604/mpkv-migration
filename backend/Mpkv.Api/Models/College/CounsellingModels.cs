namespace Mpkv.Api.Models.College
{
    // ══════════════════════════════════════════════════════════════════════════
    // Counselling CheckApplicationID — mirrors Counselling/CheckApplicationID.aspx
    //
    // Flags: OfferSeat | CancelOfferedSeat
    //
    // Access:  UserTypeID 31 or 61 only
    // College restriction: UserTypeID=61 AND CourseID != 3 → show error, hide form
    //
    // SPs:
    //   Admission_GetPhaseList(@UserTypeID, @Flag="Counselling", @UserLoginID)
    //   Base_GetCandidateID(@ApplicationID)
    //   Counselling_GetEligibilityFlagForCounselling(@CandidateID, @PhaseID, @UserLoginID)
    //     → IsEligible (bool), ErrMsg (string)
    //     → if eligible: navigate to OfferSeat page
    //   Counselling_GetEligibilityFlagForCancelOfferedSeat(@CandidateID, @PhaseID, @DistrictID, @UserLoginID)
    //     → IsEligible (bool), ErrMsg (string)
    //     → if eligible: navigate to CancelOfferedSeat page
    // ══════════════════════════════════════════════════════════════════════════

    public class CounsellingCheckRequest
    {
        public string ApplicationID { get; set; } = string.Empty;
        public short  PhaseID       { get; set; }
        /// <summary>OfferSeat | CancelOfferedSeat</summary>
        public string Flag          { get; set; } = string.Empty;
    }

    public class CounsellingCheckResponse
    {
        public bool   Success      { get; set; }
        public string Message      { get; set; } = string.Empty;
        /// <summary>
        /// If eligible — URL to navigate to next page
        /// e.g. /college/spot-round/offer-seat-form?p1=xxx&p2=yyy&r1=zzz
        /// </summary>
        public string NavigateTo   { get; set; } = string.Empty;
        /// <summary>Whether the form should be shown (false when college CourseID != 3)</summary>
        public bool   FormVisible  { get; set; } = true;
    }

    public class CounsellingPhasesResponse
    {
        public bool            Success        { get; set; }
        public string          Message        { get; set; } = string.Empty;
        public List<PhaseItem> Phases         { get; set; } = new();
        public int             CurrentPhaseID { get; set; }
        /// <summary>False when college user CourseID != 3 — mirrors upAdmission.Visible = false</summary>
        public bool            FormVisible    { get; set; } = true;
        public string          AccessError    { get; set; } = string.Empty;
    }
}
