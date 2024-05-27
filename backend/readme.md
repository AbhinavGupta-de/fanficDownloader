# Fanfic Downloader Backend

This is built in java using spring boot and selenium. It is a backend service that downloads fanfics from fanfiction.net and archiveofourown.org. It is a RESTful service that can be used to download fanfics from the two sites. It is built to be used with the [Fanfic Downloader Frontend]().

## How to use

[//]: # (I could also just include the swagger api here as well. I need to add a rate limit to the service as well.)

To use this service, you need to have the frontend service running. You can find the frontend service [here](). Once you have the frontend service running, you can use the following endpoints to download fanfics.

### Endpoints

#### Download fanfic

To download a fanfic, you need to send a POST request to the following endpoint:

```
http://localhost:8080/download
```

The request body should be a JSON object with the following fields:

- `url`: The URL of the fanfic to download. This should be a URL from fanfiction.net or archiveofourown.org.
- `format`: The format in which to download the fanfic. This can be one of the following values:
  - `txt`: Download the fanfic as a plain text file.
  - `html`: Download the fanfic as an HTML file.
  - `pdf`: Download the fanfic as a PDF file.
- `filename`: The name of the file to save the fanfic as. This is optional, and if not provided, the service will generate a filename based on the title of the fanfic.

Here is an example request body:

```json
{
  "url": "https://www.fanfiction.net/s/1234567/1/My-Fanfic",
  "format": "txt",
  "filename": "my_fanfic.txt"
}
```

The service will respond with a JSON object containing the following fields:

- `status`: The status of the request. This will be one of the following values:
  - `success`: The fanfic was downloaded successfully.
  - `error`: There was an error downloading the fanfic.
- `message`: A message describing the status of the request. If the status is `error`, this will contain an error message.

Here is an example response:

```json
{
  "status": "success",
  "message": "Fanfic downloaded successfully.",
}
```