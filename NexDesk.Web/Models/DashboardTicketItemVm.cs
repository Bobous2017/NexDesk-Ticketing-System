namespace NexDesk.Web.Models
{
    public class DashboardTicketItemVm
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string CategoryName { get; set; } = string.Empty;
        public string DepartmentName { get; set; } = string.Empty;
        public string PriorityName { get; set; } = string.Empty;
        public string StatusName { get; set; } = string.Empty;
        public string AssignedToName { get; set; } = "Unassigned";
        public DateTime CreatedAt { get; set; }
    }
}
