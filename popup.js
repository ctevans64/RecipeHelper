// After popup has loaded
async function onLoad() {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      function: getRecipe,
    },
    handleRecipe
  );
}

// Get recipe from original tab
function getRecipe() {
  try {
    let url = window.location.href;
    let title = "";
    let ingrediants = [];
    let steps = [];

    // NYT parsing
    if (url.indexOf("https://cooking.nytimes.com/recipes/") > -1) {
      // Parse title
      let titleHTML = document.getElementsByClassName("recipe-title");
      title = titleHTML.length > 0 ? titleHTML[0].innerText : "";

      // Parse ingrediants
      let ingrediantsHTML =
        document.getElementsByClassName("recipe-ingredients")[0];
      if (ingrediantsHTML) {
        let quantitiesHTML = ingrediantsHTML.getElementsByClassName("quantity");
        let ingHTML = ingrediantsHTML.getElementsByClassName("ingredient-name");
        for (let i = 0; i < quantitiesHTML.length; i++) {
          let quantity = quantitiesHTML[i].innerText;
          let ingredient = ingHTML[i].innerText;
          ingrediants.push({ quantity, ingredient });
        }
      }

      // Parse instructions
      let rawStepsHTML = document.getElementsByClassName("recipe-steps");
      if (rawStepsHTML.length > 0) {
        let stepsHTML = rawStepsHTML[0].getElementsByTagName("li");
        for (let i = 0; i < stepsHTML.length; i++) {
          steps.push(stepsHTML[i].innerText);
        }
      }
    }

    // Allrecipes parsing
    if (url.indexOf("https://www.allrecipes.com/recipe/") > -1) {
      // Parse title
      let titleHTML = document.getElementsByTagName("h1");
      title = titleHTML.length > 0 ? titleHTML[0].innerText : "";

      // Parse ingrediants
      let ingrediantsHTML = document.getElementsByClassName(
        "ingredients-section"
      )[0];
      if (ingrediantsHTML) {
        let ingsHTML = ingrediantsHTML.getElementsByClassName(
          "ingredients-item-name"
        );
        for (let i = 0; i < ingsHTML.length; i++) {
          ingrediants.push({
            quantity: "",
            ingredient: ingsHTML[i].innerText,
          });
        }
      }

      // Parse steps
      let stepsHTML = document.getElementsByClassName(
        "instructions-section"
      )[0];
      console.log(stepsHTML);
      if (stepsHTML) {
        let stpsHTML = stepsHTML.getElementsByClassName("section-body");
        console.log(stpsHTML);
        for (let i = 0; i < stpsHTML.length; i++) {
          steps.push(stpsHTML[i].innerText);
        }
      }
    }
    console.log({ ingrediants, steps, title });
    return { ingrediants, steps, title };
  } catch (err) {
    return { error: { message: err.message, name: err.name } };
  }
}

// Turns recipe object into HTML in popup
function handleRecipe(scriptResult) {
  let recipe = {};

  let root = document.getElementById("recipe_root");
  root.innerHTML = "";

  if (scriptResult.length > 0) {
    recipe = scriptResult[0].result;
  }
  console.log(recipe);

  // Error occdured while parsing
  if ("error" in recipe) {
    handleError(recipe.error);
    return;
  }
  // Recipe not found
  if (!recipe || recipe.ingrediants.length == 0 || recipe.steps.length == 0) {
    let mainHeader = document.createElement("h1");
    mainHeader.innerText = "Unable to find recipe.";
    root.append(mainHeader);
    let subHeader = document.createElement("h2");
    subHeader.innerText = "Make sure you are on a suppoorted recipe page.";
    root.append(subHeader);
    return;
    return;
  } else {
  }

  // Add Title
  let mainHeader = document.createElement("h1");
  mainHeader.innerText = recipe.title;
  root.append(mainHeader);

  // Add Ingrediants
  let ingHeader = document.createElement("h2");
  ingHeader.innerText = "Ingredients";
  root.append(ingHeader);
  let ingList = document.createElement("ul");
  for (let i = 0; i < recipe.ingrediants.length; i++) {
    let ingItem = document.createElement("li");
    ingItem.innerText = `${recipe.ingrediants[i].quantity}${
      recipe.ingrediants[i].quantity == "" ? "" : " "
    }${recipe.ingrediants[i].ingredient}`;
    ingList.append(ingItem);
  }
  root.append(ingList);

  // Add Steps
  let prepHeader = document.createElement("h2");
  prepHeader.innerText = "Preperation";
  root.append(prepHeader);
  let prepList = document.createElement("ol");
  for (let i = 0; i < recipe.steps.length; i++) {
    let prepItem = document.createElement("li");
    prepItem.innerText = recipe.steps[i];
    prepList.append(prepItem);
  }
  root.append(prepList);
}

function handleError(err) {
  let root = document.getElementById("recipe_root");
  let mainHeader = document.createElement("h1");
  mainHeader.innerText = "Error occured while trying to parse recipe.";
  mainHeader.style.color = "red";
  root.append(mainHeader);
  console.log(err);
}

try {
  setTimeout(onLoad, 0);
} catch (err) {
  handleError(err);
}
