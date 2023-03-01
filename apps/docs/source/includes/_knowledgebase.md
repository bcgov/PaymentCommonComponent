# Knowledge Base

## What is a REST API?
API is an acronym for ‘Application Programming Interface’. It is a set of rules that allow programs communicate with each other, exposing data and functionality across the Internet in a uniform format.

REST is short for ‘Representational State Transfer’ - an architectural pattern that describes how distributed systems can expose an interface. The term ‘REST API’ commonly refers to an API accessed using the HTTP protocol at a predefined set of URLs.

These URLs represent any information accessed at that location, which can be returned as JSON, HTML, images, or audio files. There are one or more methods that can be performed on the given resources/information over HTTP such as: GET, POST, PUT, and DELETE. The general rule is: use GET to obtain resources, use POST to create resources, use PUT to update them, and DELETE to remove them.

## API Best Practices
Here are some API best practices to follow:

Consistent and intuitive API design: Your API should be designed in a way that is easy to understand, consistent across endpoints, and intuitive for developers to use. Use clear and descriptive naming conventions, standard HTTP methods, and clear documentation.

Versioning: APIs should be versioned to ensure that changes to the API do not break existing client applications. Use semantic versioning to ensure that each new version of the API is backwards compatible with the previous version.

Security: APIs should be secured to prevent unauthorized access and protect user data. Use standard authentication and authorization mechanisms such as OAuth2 or API keys and encrypt sensitive data with HTTPS.

Error handling: Your API should provide clear and descriptive error messages to help developers understand what went wrong and how to fix it. Use standard HTTP status codes and error formats.

Performance: Your API should be designed to be fast and efficient. Use caching where appropriate, minimize unnecessary data transfers, and use compression to reduce response sizes.

Documentation: Your API should be well-documented to help developers understand how to use it. Use a consistent and easy-to-understand format for documentation, such as Swagger or OpenAPI.

Testing: Your API should be thoroughly tested to ensure that it functions as expected. Use automated tests to verify that each endpoint works as intended, and test for performance and scalability.

Monitoring: Your API should be monitored to ensure that it is functioning correctly and to identify issues before they become problems. Use logging and monitoring tools to track API usage, error rates, and response times.

By following these best practices, you can ensure that your API is easy to use, secure, and reliable for your users.

## Working with cURL
Curl is a command-line tool used to transfer data over various protocols such as HTTP, HTTPS, FTP, FTPS, SFTP, etc. Here is a beginner's guide to using the curl command line:

### Basic GET request:

To make a basic GET request, simply use the curl command followed by the URL:

`curl https://www.example.com` 

This will retrieve the HTML content of the webpage at https://www.example.com.

### Adding headers:

You can add headers to your request using the -H option followed by the header name and value:

`curl -H "Content-Type: application/json" https://api.example.com/data`

This will add the "Content-Type" header with a value of "application/json" to your request.

### Sending data:

You can send data with your request using the -d option followed by the data:

`curl -d '{"name": "John", "age": 30}' https://api.example.com/data`

This will send the JSON data {"name": "John", "age": 30} with your request.

### Authentication:

You can add authentication to your request using the -u option followed by your username and password:

`curl -u username:password https://api.example.com/data`

This will send your username and password with your request for authentication.

### Saving response:

You can save the response to a file using the -o option followed by the filename:

`curl -o output.html https://www.example.com`


This will save the HTML content of the webpage at `https://www.example.com` to the file "output.html".

### Basic POST request:

To send a POST request with CURL, you can use the following command:

`curl -X POST -H "Content-Type: application/json" -d '{"key1":"value1", "key2":"value2"}' http://example.com/api/endpoint`

Here's a breakdown of the command:

`curl`: the command to use CURL

`-X POST`: specifies that we want to use the HTTP POST method

`-H "Content-Type: application/json"`: sets the content type header to JSON

`-d '{"key1":"value1", "key2":"value2"}'`: specifies the data to send in the POST request, in this case a JSON object

`http://example.com/api/endpoint`: the URL of the API endpoint to which the request is being sent
You can modify the data and URL to match the specific requirements of the API you are using.

These are some of the basic features of curl. There are many more options and configurations available, so it's worth reading the documentation to learn more.

