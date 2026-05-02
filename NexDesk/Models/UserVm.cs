namespace NexDesk.Web.Models
{
    public class UserVm
    {
        public int Id { get; set; }
        public int RoleId { get; set; }
        public string? RoleName { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? UserName { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? RfidChip { get; set; }
        public string? PassWord { get; set; } // plain text on create, empty on update = no change
    }
}
