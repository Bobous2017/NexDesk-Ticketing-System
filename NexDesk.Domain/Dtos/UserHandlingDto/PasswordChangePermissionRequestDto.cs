namespace NexDesk.Domain.Dtos.UserHandlingDto
{
    public class PasswordChangePermissionRequestDto
    {
        public string Email { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string? Reason { get; set; }
    }
}
