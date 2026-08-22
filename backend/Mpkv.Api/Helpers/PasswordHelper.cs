namespace Mpkv.Api.Helpers
{
    /// <summary>
    /// Password encoding helpers — mirrors CommonHelper.Base64Encrypt / Base64Decrypt
    /// from the old ASP.NET project.
    /// The old project stored passwords as Base64(UTF8 bytes).
    /// </summary>
    public static class PasswordHelper
    {
        /// <summary>
        /// Encodes a plaintext password for storage / SP comparison.
        /// Mirrors: CommonHelper.Base64Encrypt(password)
        /// </summary>
        public static string Encode(string plainText)
            => Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(plainText));

        /// <summary>
        /// Decodes a stored Base64 password back to plaintext.
        /// Mirrors: CommonHelper.Base64Decrypt(encoded)
        /// Used in GetCollegePassword and ResetCollegePassword pages.
        /// </summary>
        public static string Decode(string encoded)
        {
            try
            {
                return System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(encoded));
            }
            catch
            {
                return string.Empty;
            }
        }

        /// <summary>
        /// Validates password complexity — matches the old Web Forms RegularExpressionValidator:
        /// 8–15 characters, at least 1 uppercase, 1 lowercase, 1 digit, 1 special character.
        /// </summary>
        public static bool IsValidPassword(string password)
        {
            if (password.Length < 8 || password.Length > 15) return false;
            bool hasUpper   = password.Any(char.IsUpper);
            bool hasLower   = password.Any(char.IsLower);
            bool hasDigit   = password.Any(char.IsDigit);
            bool hasSpecial = password.Any(c => !char.IsLetterOrDigit(c));
            return hasUpper && hasLower && hasDigit && hasSpecial;
        }
    }
}
