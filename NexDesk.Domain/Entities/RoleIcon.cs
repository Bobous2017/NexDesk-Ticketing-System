using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NexDesk.Domain.Entities
{
    public static class RoleIcon
    {
        public static string For(string? role)
        {
            var r = (role ?? "").ToLowerInvariant();
            var icon = r.Contains("admin") ? "👨‍💻"
                     : r.Contains("support") ? "👩‍🏫"
                     : r.Contains("student") ? "🎓"
                     : r.Contains("user") ? "👔"
                     : "🧩";
            var color = r.Contains("admin") ? "#10b981" :
                        r.Contains("support") ? "#f59e0b" :
                        r.Contains("user") ? "#6366f1" : "#6b7280";
            return $"<span class='role-badge'><span style='display:inline-block;width:.55rem;height:.55rem;border-radius:9999px;background:{color};margin-right:.4rem;'></span>{System.Net.WebUtility.HtmlEncode(role)} {icon}</span>";
        }
    }
}
