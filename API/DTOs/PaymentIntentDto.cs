namespace API.Dtos
{
    public class PaymentIntentDto
    {
        public string ClientSecret { get; set; } = string.Empty;
        public object? PaymentMethod { get; set; }
    }
}