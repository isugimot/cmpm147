// project.js - purpose and description here
// Author: Your Name
// Date:

// NOTE: This is how we might start a basic JavaaScript OOP project

// Constants - User-servicable parts
// In a longer project I like to put these in a separate file

// define a class
class MyProjectClass {
  // constructor function
  constructor(param1, param2) {
    // set properties using 'this' keyword
    this.property1 = param1;
    this.property2 = param2;
  }
  
  // define a method
  myMethod() {
    // code to run when method is called
  }
}

function main() {
  const fillers = {
    Crust: ["graham cracker crust", "home-made pie crust", "circumference"],
    ingredient1: ["peanut butter", "apple", "ground beef", "sardines", "circle", "misery"],
    ingredient2: ["cool whip", "flours", "peeled and cubed potatoes","eggs", "ruler", "headache", "chocolate"],
    ingredient3: ["white sugar", "brown sugar", "chopped onion", "calculator", "banana", "water", "nothing", "antimatter"],
    ingredient4: ["cream cheese", "butter", "salt", "paper", "banana slug", "boredom", "milk"],
    unit1: ["c", "", "lb", "g", "kg", " piles of", "t", "mg", "cm", "l", "m", " something"],
    unit2: ["tub", "pinch", "", "cm", "m", "km", "g", "c", "lb"],
    unit3: ["c", "g", "kg", "", " teaspoon", "mg", "t", " grasp"],
    unit4: ["oz", "g", " teaspoon", " sheet of", "", "kg"],
    numbers1: ["1", "2", "1/2", "3", "No", "100","50", "1/4", "10", "10,000", "", "6"],
    numbers2: ["1", "2", "3", "100", "No", "1000", "40", "1/5", "1/3"],
    numbers3: ["1", "50", "1/2", "No", "2", "1/10", "A", "banana", "1/3", "1/4", "3", "4", "5"],
    numbers4: ["18", "20", "1", "1/4", "100", "∞", "No"],
    Action1: ["Mix together", "Use", "Cook", "Don't use"],
    Action2: ["place", "start calculating", "lay"],
    Item1: ["mixture into", "pi starting with", "cooked filling into", "nothingness into"],
    Item2: ["refrigerator", "oven", "division with the diameter", "nowhere"],
    Item3: ["a golden crust", "a good smell", "a burning smell", "a grotesque something", "nothing", "the number 3.14159265359..."],
  };
  
  const template = `Ingredients:
  1)$numbers1$unit1 $ingredient1
  2)$numbers2$unit2 $ingredient2
  3)$numbers3$unit3 $ingredient3
  4)$numbers4$unit4 $ingredient4
  
  $Action1 the above ingredients and $Action2 the $Item1 $Crust.
  Place the $Crust in $Item2, and it is finished once you get $Item3.
  
  `;
  
  
  // STUDENTS: You don't need to edit code below this line.
  
  const slotPattern = /\$(\w+)/;
  
  function replacer(match, name) {
    let options = fillers[name];
    if (options) {
      return options[Math.floor(Math.random() * options.length)];
    } else {
      return `<UNKNOWN:${name}>`;
    }
  }
  
  function generate() {
    let story = template;
    while (story.match(slotPattern)) {
      story = story.replace(slotPattern, replacer);
    }
  
    /* global box */
    $('#box').text(story);
  }
  
  /* global clicker */
  $('#clicker').click(generate);
  
  generate();
  
}

// let's get this party started - uncomment me
main();