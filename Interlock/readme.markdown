# Interlock.js
A simple module to manage interlock groups in iViewer
The module provides a suite of simple calls to manage interlocks.

More info on what interlocking is can be found in our wiki:  
http://www.commandfusion.com/wiki2/software/modules-and-examples/interlocking

#### Create interlock groups via global tokens in guiDesigner
  1. Right Click project node (in project tree) and choose 'Global Token Manager...'
  1. Create a new token in the format: interlock_groupName (must start with prefix 'interlock_')
  1. Enter the digital join numbers separated by commas, eg: 1,2,3,4,5
  1. Optionally, enter the join number range (inclusive), eg: 1-5  
  Or even mix the two formats to result in a single interlock across multiple ranges, eg: 1-5,8,10,20-30
  1. The interlock will then be automatically created at runtime by this script.

#### To create an interlock group via JS:
`Interlock.create("group name", join1, join2 ... joinN);`

#### To set the currently selected item in an interlock group:
`Interlock.select("group name", join);`

#### To be notified when the current selection of an interlock group changes:
```js
Interlock.watch("group name", function(group name, newSelectedJoin, previousSelectedJoin) {
    // ... do something here ...
});
```

#### To stop being notified for an interlock group
`Interlock.unwatch("group name");`

#### To get the current selected join for an interlock group
`var join = Interlock.get("group name");`

#### to remove an interlock group (remove interlock functionality):
`Interlock.remove("group name");`