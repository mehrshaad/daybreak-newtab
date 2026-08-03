# NOTES TO FIX/IMPROVE/DEBUG/ADD

- ON CHANGING LAYOUT: THE BUTTOM PANEL SHOULD BE IN THE CENTER - also make sure that it always stays in 1 line no wrapping if possible and screen width allows - also it should have an option to auto arrange the current widgets without removing them (i dont know if you have that or not, but it should be there)

- zooming on cards, should be like zooming in the actual page. currently it feels like that you bring that closer to screen and make it full screen which is wrong. it should zoom into the cards' place without everything around it change - also in this zoom mode, the icons and layout dont need to change on zoom (its so ugly and out of place now) - also when in zoom mode, they can zoom out by clicking outside of the cards - also fix the shadow on zooming, how ever I think if you fix the zoom function to zoom to the screen instead of bringing it close, it would get fixed automatically

- also dragging icons/widgets while changing their position, still not working like a charm - the icons get dissapear somehow - fix it but for now, turn off the zooming options and the default if no zoom and we'll keep it for future versions

- also the size options can be different for each widget, for example the habit tracker can only have 3x2 and 4x2 - do this very smart, the google one can even have bigger sizes so the icons are visible

- also the light/dark mode, by default should match the browser, os

- also add overall zoom level option, which would zoom the whole page (just like pressing ctrl + in the browser and everything would be zoomed) - if not possible dont do it another way

- also buttons and searchbar on hover/focus/typing should have something that would be visible like a shadow, transition (not too much but it should be there)

- also the sidebar settings/menu should have a close animation/transition - basically everything that appears/disapears dont matter how small, should have animation/transition - also when the sidebar is open, in smaller wide displays where the sidebar collisions with the widgets, they should shift left - also the sidebar open doesnt have to make the rest of the page blurry, cause it should be visible so users know what are they changing and how would the new changes look like (no blur no black shade - everything kept as is)

- the searchbar size change has a bug on close to 0 scroll position fix that - also the searchbar should have suggestions based on, open tabs (onclick should switch to the tab), quick link pins , user bookmarks, history

- the habit tracker widget should also have a setting to set the day that week begins (and target for each week - also add a target week count of doing habit optional) and when we reach that day you should consider as a completed week, and if they meet their target, add a number which would be the number of weeks they are doing this.

- also the bg options seems to be not working at all

- in the word clocks widget, you have to appear suggestions as user types to the availible city names 

- no need to show click-to-zoom is off - the user already know

- in the store menu, the div that contains discover, installed, add widgets; dont need to have a white bg, it can be tresparent - also the whole store menu should have a close animation/transition

- also the version 2 should have a brand new icon that would match the modern look it has

- also I have added icons in the root dir, move them, rename them and use them as the icons for the relevant places (for now its only google icon itself (for the search bar), but will add others later)

- also maybe change the project structure the way that it will be microservices, each widget in a new repo that this repo would point to them - or diffenet folder in the same extention repo - or one repo for the project and one repo for all of the current and future store items which others can contribute there - whichever works best you can think about it - confirm this with me first and then go start planning and fixing (i want to be able to manage each seperately)