using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.Text;
using System.Threading.Tasks;

namespace CS2InvestmentTracker.Core.Exceptions;

[Serializable]
public class ApiResponseException : Exception
{
    public ApiResponseException(string message) : base(message) {}
    public ApiResponseException(string message, Exception innerException) : base(message, innerException) {}
}
