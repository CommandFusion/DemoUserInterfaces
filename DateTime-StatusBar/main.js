// The clock object we are going to create.
// You could create multiple clocks for multiple text objects - one for the time one for the date for instance.
var myClock, myDate;

CF.userMain = function() {
	myClock = new DateTimeDriver("s1", "hh:mm:ss tt");
	// If you want the clock to start instantly, uncomment this next line:
	//myClock.start();

	myDate = new DateTimeDriver("s2", "dddd, MMMM dd, yyyy", 60000); // Update every minute.
	myDate.start();
};