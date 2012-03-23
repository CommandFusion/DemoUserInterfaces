CF.userMain = function() {

    // Show the staus bar (not working, bug fix coming in future iViewer release)
    CF.setJoin("d17931", 1);

    // Create our httpserver that will return data
    var dataServer = httpServer("HTTP_SERVER", "HTTP_REQUEST");

    // Override the function to handle incoming requests
    dataServer.onRequestReceived = function(request, command, path, headers) {
        // This is where you would create the dynamic HTML content to serve up to the web view
        // See this page for details on manipulating the viewport for iOS:
        // http://developer.apple.com/library/IOs/#documentation/AppleApplications/Reference/SafariWebContent/UsingtheViewport/UsingtheViewport.html
        // http://code.google.com/mobile/articles/webapp_fixed_ui.html
        // Get the size of the web view
        CF.getProperties(["s1", "s11"], function (joins) {
            var body = "";
            var headers = {};
            CF.log(request + ", path: " + path);
            switch (path) {
                case "/":
                    var j = joins[0];
                    headers["Content-Type"] = "text/html";
                    // Lines ending with a backslash mean to continue to next line. The backslash does not become part of the variable assignment
                    body = '\
<html>\n\
    <head>\n\
        <title>TEST</title>\n\
        <meta name="viewport" content="width='+j.width+',initial-scale=1.0,minimum-scale=1.0,maximum-scale=1.0,user-scalable=no" />\n\
        <script type="text/javascript">\n\
            // Block all scrolling in the HTML content\n\
            function blockMove() {event.preventDefault();}\n\
        </script>\n\
    </head>\n\
    <body ontouchmove="blockMove()">\n\
        <p>Hello World!</p>\n\
        <p>This is dynamically generated HTML. You can do anything you want here!</p>\n\
        <p><img src="image/check.png" alt="success!" /></p>\n\
    </body>\n\
</html>';
                    dataServer.sendResponse(headers, body, false);
                    break;
                case "/picker" :
                    var j = joins[1];
                    headers["Content-Type"] = "text/html";
                    // Lines ending with a backslash mean to continue to next line. The backslash does not become part of the variable assignment
                    body = '\
<html>\n\
    <head>\n\
        <title>Custom Picker</title>\n\
        <meta name="viewport" content="width='+j.width+',initial-scale=1.0,minimum-scale=1.0,maximum-scale=1.0,user-scalable=no" />\n\
        <script type="text/javascript">\n\
            // Block all scrolling in the HTML content\n\
            function blockMove() {event.preventDefault();}\n\
        </script>\n\
    </head>\n\
    <body ontouchmove="blockMove()">\n\
        <form action="/pickersubmit" method="GET"><select name="list" onChange="this.form.submit()"><option>Choose me</option><option>No, choose me!</option><option>I\'m here too</option></select></form>\n\
    </body>\n\
</html>';
                    dataServer.sendResponse(headers, body, false);
                    break;
                case "/pickersubmit" :
                    CF.log(request);
                    break;
                default:
                    // Check if the request is for an image file.
                    // All image file requests must begin with /image for the purposes of this demo.
                    // The "/image" path prefix has nothing to do with the actual file path, it is just used in this demo to signify an image request.
                    if (path.indexOf("/image/") == 0) {
                        // Load the image from cache and return it
                        var ext;
                        if (path.indexOf(".") > 0) {
                            // Get the file extension for the image
                            ext = path.substring(path.indexOf(".") + 1);
                            var filename = path.substring(path.lastIndexOf("/") + 1);
                            CF.log("File Requested: " + filename);
                            // Set the content type for the reply based on the file extension (crude I know)
                            headers["Content-Type"] = "image/"+ext;
                            // Load the image file from the iViewer cache. Note the image must be somewhere in the GUI first to ensure it is actually cached.
                            // This is done by creating a cache page, just a new page that you never actually flip to, and placing any images in there purely for caching purposes.
                            CF.loadAsset(filename, CF.BINARY, function (data) {
                                // Send the image data back as HTTP Response, in binary encoding
                                dataServer.sendResponse(headers, data, true);
                            });
                        }
                    }
                    break;
            }
        });
    };

    // Start the HTTP Server
    dataServer.start();
};