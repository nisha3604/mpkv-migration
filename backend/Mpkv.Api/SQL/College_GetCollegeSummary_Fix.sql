-- Fix College_GetCollegeSummary to use LEFT JOIN
-- Original SP used INNER JOIN which drops rows when CourseID/DistrictID/CourseStatusID = 0
-- This fix changes all JOINs to LEFT JOIN so the college record always returns

CREATE OR ALTER PROCEDURE [dbo].[College_GetCollegeSummary]
    @CollegeID BIGINT
AS
    SELECT
        A.CollegeID, A.CollegeCode, A.CollegeName, A.CollegeAddress,
        District    = ISNULL(B.District, ''),
        A.Taluka, A.City, A.Pincode, A.MobileNo, A.EMailID,
        Course      = CASE
                          WHEN C.Course IS NULL THEN ''
                          ELSE C.Course + ' (MEDIUM : ' + ISNULL(D.Medium,'') + ', DURATION : '
                               + CAST(ISNULL(C.Duration,0) AS VARCHAR)
                               + (CASE WHEN ISNULL(C.Duration,0) > 1 THEN ' YEARS' ELSE ' YEAR' END) + ')'
                      END,
        CourseStatus        = ISNULL(E.CourseStatus, ''),
        A.Intake,
        HasManagementQuota  = CASE A.HasManagementQuota WHEN 1 THEN 'YES' ELSE 'NO' END,
        A.PrincipalName, A.PrincipalEMailID, A.PrincipalMobileNo,
        A.AdmissionInchargeName, A.AdmissionInchargeEMailID, A.AdmissionInchargeMobileNo,
        A.IsActive
    FROM
        Master_CollegeDetails (NOLOCK) A
        LEFT JOIN Master_District    (NOLOCK) B ON A.DistrictID    = B.DistrictID
        LEFT JOIN Master_Course      (NOLOCK) C ON A.CourseID      = C.CourseID
        LEFT JOIN Master_Medium      (NOLOCK) D ON C.MediumID      = D.MediumID
        LEFT JOIN Master_CourseStatus(NOLOCK) E ON A.CourseStatusID= E.CourseStatusID
    WHERE
        A.CollegeID = @CollegeID
GO
