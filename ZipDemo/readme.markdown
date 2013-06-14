# ZIP Demo

This CommandFusion guiDesigner project demonstrates how to load zipped JSON or XML content from a URL, then create a JSON object or XMLDocument object from the raw data.

The following JavaScript libraries are used in this project:
*  [JSUnzip](https://github.com/augustl/js-unzip)
*  [JSInflate](https://github.com/augustl/js-inflate)\

In guiDesigner, these libraries are included in the demo project via the Script Manager.

## Running the Demo
1. Download this entire repo via the zip button, and extract it.
1. Enable *Remote Debugging* option in iViewer
1. Load the [load.gui](https://github.com/CommandFusion/DemoUserInterfaces/blob/master/ZipDemo/load.gui) project in guiDesigner (found in the ZipDemo folder)
1. Upload the project to your mobile device running iViewer
1. When prompted, connect your browser (Chrome ftw) to the remote debugger interface via the URL provided
1. Press one of the buttons to load either JSON or XML content, and watch the debugger Script Log for details of whats happening

Check the [main.js](https://github.com/CommandFusion/DemoUserInterfaces/blob/master/ZipDemo/main.js) file for details on how the loading is actually done.