namespace NexDesk.Domain.Entities
{
    public record Role
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int PermissionLevel { get; set; } = 1;
    }
}
