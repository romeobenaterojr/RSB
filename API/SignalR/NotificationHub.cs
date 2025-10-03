using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using System.Threading.Tasks;
using Core.Entities.OrderAggregate;
using API.Extensions;

namespace API.SignalR
{
    public class NotificationHub : Hub
    {
        private static readonly ConcurrentDictionary<string, string> UserConnections = new();

        public override Task OnConnectedAsync()
        {
            var email = Context.GetHttpContext()?.Request.Query["email"].ToString();
            if (!string.IsNullOrEmpty(email))
            {
                UserConnections[email] = Context.ConnectionId;
                Console.WriteLine($"✅ User connected: {email}, ConnectionId: {Context.ConnectionId}");
            }

            return base.OnConnectedAsync();
        }

        public override Task OnDisconnectedAsync(Exception? exception)
        {
            var email = Context.GetHttpContext()?.Request.Query["email"].ToString();
            if (!string.IsNullOrEmpty(email) && UserConnections.TryRemove(email, out var removedId))
            {
                Console.WriteLine($"❌ User disconnected: {email}, ConnectionId: {removedId}");
            }

            return base.OnDisconnectedAsync(exception);
        }

        public static string? GetConnectionIdByEmail(string email)
        {
            UserConnections.TryGetValue(email, out var connectionId);
            return connectionId;
        }

        public async Task SendCurrentOrderToUser(Order order, string email)
        {
            var connectionId = GetConnectionIdByEmail(email);
            if (!string.IsNullOrEmpty(connectionId))
            {
                await Clients.Client(connectionId).SendAsync("OrderCompleteNotification", order.ToDto());
            }
        }
    }
}
