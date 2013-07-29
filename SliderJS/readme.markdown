# Slider JavaScript
This is an example of how to call JavaScript functions from a slider.

## Usage
1. Create a command in a system that you want to send.
2. Enter `[sliderval]` within the 'value' property of the command.
3. In the JavaScript property of the command, you can call any JavaScript function in your code, and use the predefined `data` variable, which will contain whatever the command's 'value' returns, which in this case is the slider value.

See the JS API docs for more info on the execution context of JavaScript within commands:  
http://commandfusion.com/docs/scripting/startup.html#command_send_handler

This example project also demonstrates bitwise operations such as bitshifting and logical AND expression within JavaScript for complex bit level communications.