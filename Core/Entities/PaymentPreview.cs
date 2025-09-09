using System;

namespace Core.Entities;

public class PaymentPreview
{
    public string? Brand { get; set; }
    public string? Last4 { get; set; }
    public int ExpMonth { get; set; }
    public int ExpYear { get; set; }
}
