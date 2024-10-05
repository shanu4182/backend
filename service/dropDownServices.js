import { Category, Language } from "../models/model.js";


//! Function to get all languages from the database
async function getLanguages(req, res) {
  try {
    const languages = await Language.find({});
    res.json(languages);
  } catch (error) {
    console.error("Error fetching languages:", error);
    throw error;
  }
}

//! Function to get all categories from the database
async function getCategories(req, res) {
  try {
    const categories = await Category.find({});
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
}

export { getLanguages, getCategories };
