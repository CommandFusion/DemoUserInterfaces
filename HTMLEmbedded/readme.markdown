# Embedded HTML Demo

This demonstration GUI is designed to show how to embed a static HTML page into your GUI, without serving it up from a remote location.  
This takes advantage of iViewer's ability to load zip files, and use any file in the zip as if it was a local file to the GUI.

## Usage

### The HTML File
You can create your HTML file as required, and test it out on Safari on your iPad first. iViewer uses the same web view as Safari, so everything should render and behave identically.  
Note the meta tags describing the viewport sizing - it is very important to include these meta tags if you want your content to render at 1:1 scale and prevent user from manually scaling content.
Of course you can stil let the user scale content if you require.

Another thing to note in our demo HTML file is that we have disabled scrolling completely using a JavaScript technique, so that even the elastic scrolling is disabled. This makes the HTML appear static in your GUI.

### The GUI File
Once you have your HTML file created, you can add a web view to your GUI. Create it at the exact size and location you want the web page to appear in your GUI.  
Set the web view URL to simply the HTML file name, eg. `myFile.html`  
You do NOT enter any other details in the URL field (no 'http', etc) - JUST the HTML file name.

Make sure the HTML file is saved within the same folder as your GUI file.

### Exporting for Use
Once you have created your GUI project and the HTML file, the last step is to use the export archive feature of guiDesigner.  
File > Export > Project Archive...

This will create a zip file in the same folder as your .gui file. Now simply add the .html file to your zip (drag it into the zip file is the simplest way).

### Loading the .zip into iViewer
Now you have the .zip file created, you need to load it into iViewer on your device. You can do this in two ways:

1. Have the GUI project open in guiDesigner, then using the Upload Service you can append the .zip file to the Upload Service URL, and use this as the GUI File URL in iViewer.
	eg. If your Upload Service URL is `http://192.168.0.10:8019`, then the GUI File URL you use would be something like: `http://192.168.0.10:8019/myProject.gui.zip`  
	Replace the .zip filename with the actual filename of your zip file.
1. Upload the zip file to any web server, and enter the full URL to the zip file as your GUI File URL.