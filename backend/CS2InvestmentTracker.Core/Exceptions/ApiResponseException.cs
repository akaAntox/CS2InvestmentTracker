namespace CS2InvestmentTracker.Core.Exceptions;

[Serializable]
public class ApiResponseException : Exception
{
    public ApiResponseException(string message) : base(message) { }
    public ApiResponseException(string message, Exception innerException) : base(message, innerException) { }
}

[Serializable]
public class ItemNotFoundException : Exception
{
    public ItemNotFoundException(string message) : base(message) { }
    public ItemNotFoundException(string message, Exception innerException) : base(message, innerException) { }
}