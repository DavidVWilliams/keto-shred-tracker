import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection } from 'firebase/firestore';

// --- Firebase Initialization ---
const firebaseConfig = {
  apiKey: "AIzaSyCpvNuz5IehbTALpeeEXd77__o-czl0E3M",
  authDomain: "keto-shred-tracker.firebaseapp.com",
  projectId: "keto-shred-tracker",
  storageBucket: "keto-shred-tracker.firebasestorage.app",
  messagingSenderId: "618970231709",
  appId: "1:618970231709:web:a5eaff86fa83167ec03574",
  measurementId: "G-M0YV8JNGCT"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// SVG Icons
const Icon = ({ path, size = 20, className = "", fill = "none" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    dangerouslySetInnerHTML={{ __html: path }}
  />
);

const Icons = {
  Flame: (p) => <Icon {...p} path='<path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/>' />,
  Calendar: (p) => <Icon {...p} path='<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>' />,
  BookOpen: (p) => <Icon {...p} path='<path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>' />,
  Activity: (p) => <Icon {...p} path='<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>' />,
  Clock: (p) => <Icon {...p} path='<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>' />,
  Settings: (p) => <Icon {...p} path='<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l-.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>' />,
  X: (p) => <Icon {...p} path='<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>' />,
  Plus: (p) => <Icon {...p} path='<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>' />,
  Trash: (p) => <Icon {...p} path='<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>' />,
  Youtube: (p) => <Icon {...p} fill="currentColor" path='<path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33 2.78 2.78 0 001.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.33 29 29 0 00-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="white"/>' />,
  ExternalLink: (p) => <Icon {...p} path='<path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>' />,
  Check: (p) => <Icon {...p} path='<polyline points="20 6 9 17 4 12"/>' />,
  LogOut: (p) => <Icon {...p} path='<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>' />,
  Cloud: (p) => <Icon {...p} path='<path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/>' />
};

const INITIAL_WORKOUTS = [
  { id: 'lib-bdp', name: '20-Min Busy Dad Burpees (AMRAP)', minutes: 20, url: '' },
  { id: 'lib-leo', name: '15m Leo Mobility Routine', minutes: 15, url: 'https://youtube.com/watch?v=dZ5PgW5RD7A' },
  { id: 'lib-jog', name: '30-45m Jog', minutes: 35, url: '' },
  { id: 'lib-walk', name: 'Rest Day / Gentle Walk', minutes: 20, url: '' }
];

const INITIAL_RECIPES = [
  { 
    id: 'egg-1', name: 'Cheesy Keto Scramble', category: 'Eggs', cals: 520, protein: 45, carbs: 4, fat: 36, 
    ingredients: ['3 pasture-raised eggs', '1 tbsp grass-fed butter', '1 oz sharp cheddar cheese', 'Salt & pepper'], 
    instructions: 'Melt butter in a skillet over medium heat. Crack eggs into a bowl, whisk lightly, and pour into pan. Stir gently to form soft curds. Top with cheddar in the final minute.' 
  },
  { 
    id: 'egg-2', name: 'Anti-Inflammatory Turmeric Eggs', category: 'Eggs', cals: 480, protein: 38, carbs: 3, fat: 34, 
    ingredients: ['3 pasture-raised eggs', '1/2 tsp turmeric', 'Pinch of black pepper', '1 tbsp butter', '1 cup baby spinach'], 
    instructions: 'Sauté baby spinach in butter until wilted. Whisk eggs with turmeric and pepper, pour over spinach and scramble gently.' 
  },
  { 
    id: 'egg-3', name: 'Bacon & Cheddar Omelet', category: 'Eggs', cals: 550, protein: 42, carbs: 2, fat: 41, 
    ingredients: ['3 large eggs', '3 slices cooked bacon (crumbled)', '1 oz shredded cheddar', '1 tbsp butter'], 
    instructions: 'Whisk eggs and pour into a buttered skillet over medium-low heat. Sprinkle crumbled bacon and cheddar on one half, fold over, and cook until melted.' 
  },
  { 
    id: 'egg-4', name: 'Avocado Baked Eggs', category: 'Eggs', cals: 490, protein: 32, carbs: 5, fat: 38, 
    ingredients: ['2 large avocados (halved and pitted)', '4 small pasture eggs', 'Chives', 'Salt & red pepper flakes'], 
    instructions: 'Scoop out a bit of flesh from avocado halves to fit an egg yolk. Crack an egg into each avocado cavity. Bake at 425°F for 15 minutes.' 
  },
  { 
    id: 'egg-5', name: 'Spinach & Feta Frittata Slice', category: 'Eggs', cals: 460, protein: 36, carbs: 4, fat: 32, 
    ingredients: ['3 eggs', '1 oz crumbled feta', '1 cup spinach', '1 tbsp olive oil'], 
    instructions: 'Sauté spinach in olive oil in an oven-safe skillet. Pour in whisked eggs, top with feta, and broil for 3 minutes until golden.' 
  },
  { 
    id: 'egg-6', name: 'Mushroom & Swiss Egg White Scramble', category: 'Eggs', cals: 420, protein: 48, carbs: 3, fat: 22, 
    ingredients: ['4 egg whites + 1 whole egg', '1/2 cup sliced button mushrooms', '1 oz Swiss cheese', '1 tbsp butter'], 
    instructions: 'Sauté mushrooms in butter until tender. Pour in whisked whole egg and egg whites, scrambling until soft. Fold in Swiss cheese until melted.' 
  },
  { 
    id: 'egg-7', name: 'Deviled Egg Salad with Bacon', category: 'Eggs', cals: 510, protein: 34, carbs: 2, fat: 40, 
    ingredients: ['4 hard-boiled eggs (chopped)', '2 tbsp avocado oil mayo', '1 tsp Dijon mustard', '2 strips cooked bacon (crumbled)'], 
    instructions: 'Mix chopped hard-boiled eggs with mayo, Dijon, salt, and pepper. Top generously with crispy crumbled bacon.' 
  },
  { 
    id: 'egg-8', name: 'Pesto & Goat Cheese Scramble', category: 'Eggs', cals: 530, protein: 40, carbs: 3, fat: 39, 
    ingredients: ['3 large eggs', '1 tbsp basil pesto', '1.5 oz goat cheese', '1 tbsp butter'], 
    instructions: 'Whisk eggs with pesto. Cook in butter over medium-low heat. Fold in tangy goat cheese right before eggs finish setting.' 
  },
  { 
    id: 'egg-9', name: 'Tomato & Basil Baked Shakshuka Eggs', category: 'Eggs', cals: 440, protein: 35, carbs: 8, fat: 29, 
    ingredients: ['3 eggs', '1/2 cup low-carb crushed tomatoes', '1 garlic clove (minced)', '1 tbsp olive oil', 'Fresh basil'], 
    instructions: 'Simmer tomatoes and garlic in olive oil. Make small wells in the sauce and crack eggs into them. Cover and poach on low until whites are set.' 
  },
  { 
    id: 'egg-10', name: 'Cream Cheese Fluffy Scramble', category: 'Eggs', cals: 540, protein: 38, carbs: 2, fat: 42, 
    ingredients: ['3 large eggs', '1.5 oz full-fat cream cheese', '1 tbsp grass-fed butter', 'Chives'], 
    instructions: 'Whisk eggs thoroughly with softened cream cheese pieces. Cook slowly in melted butter over low heat for ultra-creamy, fluffy curds.' 
  },
  { 
    id: 'egg-11', name: 'Ham & Cheddar Egg Cups', category: 'Eggs', cals: 470, protein: 44, carbs: 2, fat: 31, 
    ingredients: ['3 large eggs', '2 oz diced deli ham', '1 oz cheddar cheese', '1 tbsp butter'], 
    instructions: 'Crisp diced ham in a buttered skillet. Pour whisked eggs over top, scramble with cheddar until fully set.' 
  },
  { 
    id: 'egg-12', name: 'Smoked Salmon & Scallion Scramble', category: 'Eggs', cals: 490, protein: 46, carbs: 2, fat: 33, 
    ingredients: ['3 large eggs', '2 oz smoked salmon (torn)', '1 tbsp butter', 'Chopped scallions'], 
    instructions: 'Melt butter in a pan, scramble eggs gently. Fold in torn smoked salmon and fresh chopped scallions in the final 30 seconds of heat.' 
  },
  { 
    id: 'beef-1', name: 'Beef & Cabbage Skillet', category: 'Beef', cals: 650, protein: 55, carbs: 7, fat: 44, 
    ingredients: ['8 oz 80/20 ground beef', '2 cups shredded green cabbage', '1 tbsp butter', '2 tbsp bone broth', 'Sea salt & garlic powder'], 
    instructions: 'Brown ground beef in a large skillet. Add shredded cabbage and butter, sautéing until tender. Stir in bone broth and seasonings.' 
  },
  { 
    id: 'beef-2', name: 'Weekly Steak Feast (Ribeye)', category: 'Beef', cals: 680, protein: 58, carbs: 1, fat: 48, 
    ingredients: ['12 oz Ribeye steak', '2 tbsp butter', '1 fresh rosemary sprig', '2 crushed garlic cloves', 'Coarse sea salt'], 
    instructions: 'Season ribeye with salt. Sear in a hot cast-iron skillet for 4 mins per side. Add butter, garlic, and rosemary, spooning melted butter continuously.' 
  },
  { 
    id: 'beef-3', name: 'Garlic Butter Steak Bites', category: 'Beef', cals: 640, protein: 56, carbs: 1, fat: 45, 
    ingredients: ['10 oz sirloin steak (cubed)', '2 tbsp butter', '3 minced garlic cloves', 'Oregano', 'Salt & pepper'], 
    instructions: 'Sear sirloin cubes in a smoking hot skillet for 2 minutes. Reduce heat, toss with butter, garlic, and oregano for 1 minute before serving.' 
  },
  { 
    id: 'beef-4', name: 'Keto Cheeseburger Bowl', category: 'Beef', cals: 620, protein: 52, carbs: 4, fat: 43, 
    ingredients: ['8 oz ground beef', '2 oz cheddar cheese', '2 cups shredded lettuce', '2 tbsp special mayo-mustard sauce', 'Pickles'], 
    instructions: 'Brown ground beef with salt and pepper. Serve over a bed of shredded lettuce topped with melted cheddar, pickles, and low-carb burger sauce.' 
  },
  { 
    id: 'beef-5', name: 'Mushroom Swiss Ground Beef Bowl', category: 'Beef', cals: 590, protein: 50, carbs: 3, fat: 41, 
    ingredients: ['8 oz ground beef', '1 cup sliced mushrooms', '1.5 oz Swiss cheese', '1 tbsp butter'], 
    instructions: 'Sauté mushrooms in butter until golden, remove. Brown ground beef in the same pan, mix mushrooms back in, and top with melting Swiss cheese.' 
  },
  { 
    id: 'beef-6', name: 'Keto Beef Stroganoff Bowl', category: 'Beef', cals: 660, protein: 54, carbs: 5, fat: 47, 
    ingredients: ['8 oz sliced flank steak', '1/2 cup heavy cream', '1 cup sliced mushrooms', '1 tbsp butter', 'Dijon mustard'], 
    instructions: 'Sear sliced flank steak and mushrooms in butter. Stir in heavy cream and Dijon, simmering until rich and thickened.' 
  },
  { 
    id: 'beef-7', name: 'Bacon Wrapped Meatloaf Slice', category: 'Beef', cals: 610, protein: 48, carbs: 4, fat: 44, 
    ingredients: ['8 oz ground beef', '1 egg', '1 oz almond flour', '2 strips bacon wrapped on top', 'Sugar-free ketchup glaze'], 
    instructions: 'Mix beef, egg, almond flour, and seasonings. Shape into a mini loaf, wrap with bacon, glaze lightly, and bake at 375°F for 35 mins.' 
  },
  { 
    id: 'beef-8', name: 'Classic New York Strip with Herb Butter', category: 'Beef', cals: 630, protein: 60, carbs: 0, fat: 42, 
    ingredients: ['10 oz NY Strip steak', '2 tbsp compound herb butter', 'Sea salt & cracked pepper'], 
    instructions: 'Pan-sear NY strip to medium-rare. Rest for 5 minutes, then top immediately with a melting pat of herb butter.' 
  },
  { 
    id: 'beef-9', name: 'Spicy Beef & Pepper Stir-Fry', category: 'Beef', cals: 580, protein: 52, carbs: 6, fat: 38, 
    ingredients: ['8 oz sliced flank steak', '1 cup sliced bell peppers', '1 tbsp avocado oil', 'Tamari soy sauce', 'Ginger & garlic'], 
    instructions: 'Flash-fry sliced flank steak and bell peppers in avocado oil over high heat. Toss with tamari, minced ginger, and garlic.' 
  },
  { 
    id: 'beef-10', name: 'Cheesy Taco Beef Skillet', category: 'Beef', cals: 610, protein: 53, carbs: 4, fat: 42, 
    ingredients: ['8 oz ground beef', '1 tbsp keto taco seasoning', '2 oz Mexican blend cheese', '2 tbsp sour cream'], 
    instructions: 'Brown ground beef with taco seasoning and 2 tbsp water. Melt Mexican blend cheese directly on top and garnish with sour cream.' 
  },
  { 
    id: 'beef-11', name: 'Steak & Blue Cheese Salad', category: 'Beef', cals: 590, protein: 50, carbs: 3, fat: 41, 
    ingredients: ['8 oz sliced sirloin steak', '2 cups mixed greens', '1.5 oz crumbled blue cheese', '2 tbsp olive oil & vinegar'], 
    instructions: 'Grill or pan-sear sirloin steak. Lay warm steak slices over fresh mixed greens tossed with olive oil, vinegar, and crumbled blue cheese.' 
  },
  { 
    id: 'beef-12', name: 'Slow-Simmered Beef Bone Broth Stew', category: 'Beef', cals: 540, protein: 58, carbs: 5, fat: 32, 
    ingredients: ['8 oz cubed chuck roast', '2 cups rich beef bone broth', '1 cup chopped celery', '1 tbsp grass-fed butter'], 
    instructions: 'Brown chuck roast cubes in butter, then simmer slowly in rich beef bone broth and chopped celery until fork-tender.' 
  },
  { 
    id: 'fish-1', name: 'Ginger Salmon & Avo Bowl', category: 'Fish', cals: 620, protein: 46, carbs: 5, fat: 42, 
    ingredients: ['6 oz wild salmon fillet', '1 tbsp ginger-infused avocado oil', '1/2 sliced avocado', '2 cups baby greens', 'Lemon juice'], 
    instructions: 'Brush salmon with ginger oil and bake at 400°F for 12-15 mins. Serve over baby greens with fresh sliced avocado and lemon.' 
  },
  { 
    id: 'fish-2', name: 'Lemon Garlic Butter Shrimp', category: 'Fish', cals: 490, protein: 46, carbs: 2, fat: 33, 
    ingredients: ['10 oz large shrimp (peeled)', '3 tbsp butter', '4 minced garlic cloves', 'Fresh lemon juice', 'Parsley'], 
    instructions: 'Sauté garlic in butter until fragrant. Add shrimp and cook for 2-3 mins until pink. Drizzle with lemon juice and garnish with parsley.' 
  },
  { 
    id: 'fish-3', name: 'Crispy Pan-Seared White Fish & Asparagus', category: 'Fish', cals: 460, protein: 48, carbs: 4, fat: 28, 
    ingredients: ['7 oz cod or halibut fillet', '10 spears asparagus', '2 tbsp butter', 'Lemon zest'], 
    instructions: 'Pan-sear cod in butter until golden and flaky. Sauté asparagus spears in the same pan until tender-crisp.' 
  },
  { 
    id: 'fish-4', name: 'Creamy Garlic Butter Scallops', category: 'Fish', cals: 510, protein: 42, carbs: 4, fat: 35, 
    ingredients: ['8 oz sea scallops', '2 tbsp butter', '1/4 cup heavy cream', 'Minced garlic'], 
    instructions: 'Sear sea scallops in a hot pan with butter for 2 mins per side; remove. Deglaze pan with cream and garlic to create a rich pan sauce.' 
  },
  { 
    id: 'fish-5', name: 'Cajun Blackened Mahi Mahi', category: 'Fish', cals: 480, protein: 50, carbs: 2, fat: 30, 
    ingredients: ['7 oz Mahi Mahi fillet', '1 tbsp Cajun spice rub', '2 tbsp butter'], 
    instructions: 'Coat Mahi Mahi generously in Cajun spices. Sear in a screaming hot cast-iron skillet with butter for 3-4 mins per side.' 
  },
  { 
    id: 'fish-6', name: 'Tuna & Avocado Lettuce Boats', category: 'Fish', cals: 450, protein: 44, carbs: 3, fat: 29, 
    ingredients: ['1 can (6 oz) wild tuna (drained)', '2 tbsp avocado oil mayo', '1/2 diced avocado', 'Romaine lettuce leaves'], 
    instructions: 'Mix tuna, mayo, and diced avocado. Spoon generous portions into crisp Romaine lettuce leaves for handheld wraps.' 
  },
  { 
    id: 'fish-7', name: 'Baked Salmon with Pesto Crust', category: 'Fish', cals: 600, protein: 48, carbs: 2, fat: 43, 
    ingredients: ['6 oz salmon fillet', '2 tbsp basil pesto', '1 tbsp grated parmesan'], 
    instructions: 'Spread basil pesto evenly over the top of the salmon fillet, sprinkle with parmesan, and bake at 400°F until flaky.' 
  },
  { 
    id: 'fish-8', name: 'Garlic Butter Sardines & Greens', category: 'Fish', cals: 470, protein: 42, carbs: 2, fat: 32, 
    ingredients: ['2 cans fresh or packed sardines', '2 tbsp butter', 'Lemon juice', '2 cups spinach'], 
    instructions: 'Warm sardines gently in butter and lemon juice, serving over a fresh bed of wilted spinach.' 
  },
  { 
    id: 'fish-9', name: 'Creamy Tuscan Garlic Salmon', category: 'Fish', cals: 640, protein: 49, carbs: 5, fat: 46, 
    ingredients: ['6 oz salmon fillet', '1/3 cup heavy cream', '2 tbsp sun-dried tomatoes', '1 cup spinach', '1 tbsp olive oil'], 
    instructions: 'Sear salmon and set aside. In same pan, simmer heavy cream, sun-dried tomatoes, and spinach. Return salmon to sauce.' 
  },
  { 
    id: 'fish-10', name: 'Lemon Herb Baked Trout', category: 'Fish', cals: 520, protein: 52, carbs: 1, fat: 34, 
    ingredients: ['7 oz whole trout or fillet', '2 tbsp butter', 'Fresh dill', 'Lemon slices'], 
    instructions: 'Top trout with butter pats, fresh dill, and lemon slices. Wrap in parchment paper and bake at 375°F for 18 minutes.' 
  },
  { 
    id: 'fish-11', name: 'Chipotle Lime Shrimp Salad', category: 'Fish', cals: 490, protein: 45, carbs: 4, fat: 32, 
    ingredients: ['8 oz shrimp', '1 tsp chipotle powder', 'Lime juice', '2 cups shredded cabbage', '2 tbsp mayo'], 
    instructions: 'Sauté shrimp with chipotle powder and lime juice. Toss with shredded cabbage and creamy lime mayo dressing.' 
  },
  { 
    id: 'fish-12', name: 'Sesame Crusted Ahi Tuna Steak', category: 'Fish', cals: 530, protein: 56, carbs: 2, fat: 31, 
    ingredients: ['7 oz Ahi tuna steak', '1 tbsp black & white sesame seeds', '1 tbsp avocado oil', 'Tamari'], 
    instructions: 'Press sesame seeds onto all sides of the Ahi tuna. Sear in avocado oil for 1 min per side so the center remains rare.' 
  },
  { 
    id: 'poultry-1', name: 'Crispy Chicken & Avocado Wrap', category: 'Poultry', cals: 590, protein: 48, carbs: 4, fat: 40, 
    ingredients: ['6 oz shredded chicken breast', '2 eggs & 1 oz mozzarella (for cheese wrap shell)', '2 tbsp avocado oil mayo', '1/2 sliced avocado'], 
    instructions: 'Melt mozzarella and beaten eggs in a small pan to form a zero-carb wrap shell. Fill with shredded chicken, mayo, and avocado.' 
  },
  { 
    id: 'poultry-2', name: 'Creamy Tuscan Garlic Chicken', category: 'Poultry', cals: 610, protein: 52, carbs: 4, fat: 42, 
    ingredients: ['2 chicken thighs', '1/2 cup heavy cream', '1/4 cup sun-dried tomatoes', '1 cup spinach', '2 garlic cloves'], 
    instructions: 'Sear chicken thighs until golden; remove. Sauté garlic, sun-dried tomatoes, and heavy cream. Simmer with spinach and chicken.' 
  },
  { 
    id: 'poultry-3', name: 'Bacon Ranch Chicken Skillet', category: 'Poultry', cals: 630, protein: 55, carbs: 2, fat: 44, 
    ingredients: ['2 chicken breasts (cubed)', '3 strips bacon (chopped)', '2 tbsp ranch seasoning', '2 tbsp butter'], 
    instructions: 'Crisp chopped bacon in a skillet, remove. Sear chicken cubes in the bacon fat and butter, toss with ranch seasoning and crispy bacon.' 
  },
  { 
    id: 'poultry-4', name: 'Lemon Herb Roasted Turkey Thigh', category: 'Poultry', cals: 580, protein: 58, carbs: 1, fat: 37, 
    ingredients: ['8 oz turkey thigh', '2 tbsp butter', 'Lemon zest & rosemary', 'Garlic powder'], 
    instructions: 'Rub turkey thigh with butter, lemon zest, rosemary, and garlic. Roast at 375°F for 35 minutes until skin is crispy.' 
  },
  { 
    id: 'poultry-5', name: 'Buffalo Chicken & Blue Cheese Bowl', category: 'Poultry', cals: 570, protein: 53, carbs: 2, fat: 38, 
    ingredients: ['7 oz shredded grilled chicken', '3 tbsp buffalo hot sauce', '1.5 oz blue cheese crumbles', '2 tbsp butter'], 
    instructions: 'Warm shredded chicken in a pan with melted butter and buffalo hot sauce. Top with cooling blue cheese crumbles.' 
  },
  { 
    id: 'poultry-6', name: 'Garlic Parmesan Chicken Wings', category: 'Poultry', cals: 650, protein: 46, carbs: 1, fat: 51, 
    ingredients: ['8 chicken wings', '3 tbsp butter', '1/4 cup grated parmesan', 'Minced garlic'], 
    instructions: 'Bake chicken wings at 400°F for 45 minutes until extra crispy. Toss immediately in melted butter, garlic, and parmesan.' 
  },
  { 
    id: 'poultry-7', name: 'Creamy Mushroom Chicken Thighs', category: 'Poultry', cals: 600, protein: 50, carbs: 4, fat: 43, 
    ingredients: ['2 chicken thighs', '1 cup sliced mushrooms', '1/3 cup heavy cream', '1 tbsp butter'], 
    instructions: 'Sear chicken thighs in butter; remove. Sauté mushrooms, stir in heavy cream, and simmer chicken until sauce coats the back of a spoon.' 
  },
  { 
    id: 'poultry-8', name: 'Prosciutto Wrapped Chicken Breast', category: 'Poultry', cals: 560, protein: 56, carbs: 1, fat: 36, 
    ingredients: ['1 large chicken breast', '2 slices prosciutto', '1 tbsp olive oil', 'Sage leaves'], 
    instructions: 'Wrap chicken breast tightly with prosciutto slices and fresh sage leaves. Pan-sear in olive oil and bake until cooked through.' 
  },
  { 
    id: 'poultry-9', name: 'Chicken Fajita Lettuce Cups', category: 'Poultry', cals: 510, protein: 48, carbs: 6, fat: 32, 
    ingredients: ['7 oz sliced chicken breast', '1 cup bell peppers & onions', '1 tbsp avocado oil', 'Fajita spices'], 
    instructions: 'Sauté sliced chicken, bell peppers, and onions in avocado oil with fajita spices. Spoon into crisp lettuce cups.' 
  },
  { 
    id: 'poultry-10', name: 'Pesto Chicken Bake with Mozzarella', category: 'Poultry', cals: 620, protein: 54, carbs: 2, fat: 44, 
    ingredients: ['2 chicken breasts', '2 tbsp basil pesto', '2 oz fresh mozzarella slices'], 
    instructions: 'Top chicken breasts with pesto and fresh mozzarella. Bake at 375°F for 25 minutes until cheese is bubbly and golden.' 
  },
  { 
    id: 'poultry-11', name: 'Creamy Spinach Stuffed Chicken', category: 'Poultry', cals: 590, protein: 53, carbs: 3, fat: 40, 
    ingredients: ['1 large chicken breast (pocket sliced)', '2 oz cream cheese', '1/2 cup cooked spinach', 'Garlic powder'], 
    instructions: 'Stuff a pocket in chicken breast with cream cheese and cooked spinach. Secure with toothpicks and bake until tender.' 
  },
  { 
    id: 'poultry-12', name: 'Chicken Thigh & Avocado Salad', category: 'Poultry', cals: 570, protein: 49, carbs: 4, fat: 39, 
    ingredients: ['2 grilled chicken thighs (sliced)', '2 cups mixed greens', '1/2 sliced avocado', 'Olive oil & lime dressing'], 
    instructions: 'Lay warm grilled chicken thigh slices over a bed of mixed greens and fresh avocado. Dress with olive oil and lime.' 
  }
];

const SCHEDULE = [
  { 
    id: 1, dayName: 'Monday', dayType: 'standard', cals: 1650, protein: 155, carbs: 20, fat: 120,
    workouts: [{ id: 'w-mon-1', name: '20-Min Busy Dad Burpees (AMRAP)', minutes: 20, url: '' }],
    meals: [
      { id: 'm-mon-1', name: 'Cheesy Keto Scramble', cals: 520, protein: 45, carbs: 4, fat: 36 },
      { id: 'm-mon-2', name: 'Beef & Cabbage Skillet', cals: 650, protein: 55, carbs: 7, fat: 44 }
    ]
  },
  { 
    id: 2, dayName: 'Tuesday', dayType: 'fasting', cals: 0, protein: 0, carbs: 0, fat: 0,
    workouts: [
      { id: 'w-tue-1', name: '30-45m Jog', minutes: 35, url: '' },
      { id: 'w-tue-2', name: '15m Leo Mobility Routine', minutes: 15, url: 'https://youtube.com/watch?v=dZ5PgW5RD7A' }
    ],
    meals: []
  },
  { 
    id: 3, dayName: 'Wednesday', dayType: 'adf-eat', cals: 2000, protein: 175, carbs: 25, fat: 140,
    workouts: [{ id: 'w-wed-1', name: '20-Min Busy Dad Burpees (AMRAP)', minutes: 20, url: '' }],
    meals: [
      { id: 'm-wed-1', name: 'Anti-Inflammatory Turmeric Eggs', cals: 480, protein: 38, carbs: 3, fat: 34 },
      { id: 'm-wed-2', name: 'Ginger Salmon & Avo Bowl', cals: 620, protein: 46, carbs: 5, fat: 42 }
    ]
  },
  { 
    id: 4, dayName: 'Thursday', dayType: 'fasting', cals: 0, protein: 0, carbs: 0, fat: 0,
    workouts: [
      { id: 'w-thu-1', name: '30-45m Jog', minutes: 35, url: '' },
      { id: 'w-thu-2', name: '15m Leo Mobility Routine', minutes: 15, url: 'https://youtube.com/watch?v=dZ5PgW5RD7A' }
    ],
    meals: []
  },
  { 
    id: 5, dayName: 'Friday', dayType: 'adf-eat', cals: 2000, protein: 175, carbs: 25, fat: 140,
    workouts: [{ id: 'w-fri-1', name: '20-Min Busy Dad Burpees (AMRAP)', minutes: 20, url: '' }],
    meals: [
      { id: 'm-fri-1', name: 'Crispy Chicken & Avocado Wrap', cals: 590, protein: 48, carbs: 4, fat: 40 },
      { id: 'm-fri-2', name: 'Weekly Steak Feast (Ribeye)', cals: 680, protein: 58, carbs: 1, fat: 48 }
    ]
  },
  { 
    id: 6, dayName: 'Saturday', dayType: 'standard', cals: 1650, protein: 155, carbs: 20, fat: 120,
    workouts: [{ id: 'w-sat-1', name: '20-Min Busy Dad Burpees (AMRAP)', minutes: 20, url: '' }],
    meals: [
      { id: 'm-sat-1', name: 'Cheesy Keto Scramble', cals: 520, protein: 45, carbs: 4, fat: 36 },
      { id: 'm-sat-2', name: 'Beef & Cabbage Skillet', cals: 650, protein: 55, carbs: 7, fat: 44 }
    ]
  },
  { 
    id: 0, dayName: 'Sunday', dayType: 'standard', cals: 1650, protein: 155, carbs: 20, fat: 120,
    workouts: [{ id: 'w-sun-1', name: 'Rest Day / Gentle Walk', minutes: 20, url: '' }],
    meals: [
      { id: 'm-sun-1', name: 'Cheesy Keto Scramble', cals: 520, protein: 45, carbs: 4, fat: 36 },
      { id: 'm-sun-2', name: 'Weekly Steak Feast (Ribeye)', cals: 680, protein: 58, carbs: 1, fat: 48 }
    ]
  }
];

export default function App() {
  const [user, setUser] = useState(null);

  const [activeTab, setActiveTab] = useState('schedule');
  const todayId = new Date().getDay();
  const [selectedDay, setSelectedDay] = useState(todayId);

  // Completion State (Loaded from localStorage immediately)
  const [completion, setCompletion] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ks_completion') || '{}'); } catch { return {}; }
  });

  // Fasting Timer State
  const [fastingState, setFastingState] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ks_fasting') || '{"active":false, "startTime":null, "preset":36}'); } catch { return { active: false, startTime: null, preset: 36 }; }
  });

  // Custom Workouts & Meals Overrides
  const [customDays, setCustomDays] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ks_custom_days') || '{}'); } catch { return {}; }
  });

  // Master Global Workout Library State
  const [workoutLibrary, setWorkoutLibrary] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ks_workout_library') || JSON.stringify(INITIAL_WORKOUTS)); } catch { return INITIAL_WORKOUTS; }
  });

  // Weight Tracker State
  const [weightData, setWeightData] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ks_weight') || '{"start":205, "current":198, "goal":180}'); } catch { return { start: 205, current: 198, goal: 180 }; }
  });

  // Recipes State
  const [recipes, setRecipes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ks_recipes') || JSON.stringify(INITIAL_RECIPES)); } catch { return INITIAL_RECIPES; }
  });

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState(null);

  // Recipe Detail Modal State
  const [activeRecipeModal, setActiveRecipeModal] = useState(null);

  // Recipe Category Filter
  const [recipeCategory, setRecipeCategory] = useState('All');

  // Modals
  const [modalType, setModalType] = useState(null); // 'goals' | 'workout' | 'meal' | 'weight' | 'manageWorkouts' | null

  // Inputs for adding items
  const [selectedWorkoutIdToAdd, setSelectedWorkoutIdToAdd] = useState(workoutLibrary[0]?.id || '');
  const [newLibWorkoutName, setNewLibWorkoutName] = useState('');
  const [newLibWorkoutMins, setNewLibWorkoutMins] = useState(20);
  const [newLibWorkoutUrl, setNewLibWorkoutUrl] = useState('');
  const [selectedRecipeToAdd, setSelectedRecipeToAdd] = useState(recipes[0]?.id || '');

  // --- Firebase Auth & Firestore Sync ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDocRef = doc(collection(db, "users"), currentUser.uid);
          const docSnap = await getDoc(userDocRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.completion) { setCompletion(data.completion); localStorage.setItem('ks_completion', JSON.stringify(data.completion)); }
            if (data.fastingState) { setFastingState(data.fastingState); localStorage.setItem('ks_fasting', JSON.stringify(data.fastingState)); }
            if (data.customDays) { setCustomDays(data.customDays); localStorage.setItem('ks_custom_days', JSON.stringify(data.customDays)); }
            if (data.workoutLibrary) { setWorkoutLibrary(data.workoutLibrary); localStorage.setItem('ks_workout_library', JSON.stringify(data.workoutLibrary)); }
            if (data.weightData) { setWeightData(data.weightData); localStorage.setItem('ks_weight', JSON.stringify(data.weightData)); }
            if (data.recipes) { setRecipes(data.recipes); localStorage.setItem('ks_recipes', JSON.stringify(data.recipes)); }
          } else {
            const initialData = {
              email: currentUser.email,
              completion,
              fastingState,
              customDays,
              workoutLibrary,
              weightData,
              recipes,
              initializedAt: new Date().toISOString()
            };
            await setDoc(userDocRef, initialData);
          }
        } catch (err) {
          console.warn("Cloud sync error:", err.message);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const syncToCloudAndLocal = async (updatedState) => {
    try {
      if (updatedState.completion !== undefined) localStorage.setItem('ks_completion', JSON.stringify(updatedState.completion));
      if (updatedState.fastingState !== undefined) localStorage.setItem('ks_fasting', JSON.stringify(updatedState.fastingState));
      if (updatedState.customDays !== undefined) localStorage.setItem('ks_custom_days', JSON.stringify(updatedState.customDays));
      if (updatedState.workoutLibrary !== undefined) localStorage.setItem('ks_workout_library', JSON.stringify(updatedState.workoutLibrary));
      if (updatedState.weightData !== undefined) localStorage.setItem('ks_weight', JSON.stringify(updatedState.weightData));
      if (updatedState.recipes !== undefined) localStorage.setItem('ks_recipes', JSON.stringify(updatedState.recipes));
    } catch (e) {}

    // Background sync to Firestore if logged in
    if (user) {
      try {
        const userDocRef = doc(collection(db, "users"), user.uid);
        await setDoc(userDocRef, {
          completion: updatedState.completion !== undefined ? updatedState.completion : completion,
          fastingState: updatedState.fastingState !== undefined ? updatedState.fastingState : fastingState,
          customDays: updatedState.customDays !== undefined ? updatedState.customDays : customDays,
          workoutLibrary: updatedState.workoutLibrary !== undefined ? updatedState.workoutLibrary : workoutLibrary,
          weightData: updatedState.weightData !== undefined ? updatedState.weightData : weightData,
          recipes: updatedState.recipes !== undefined ? updatedState.recipes : recipes,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn("Background cloud sync pending:", err.message);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setToastMessage('Signed in & profile saved to cloud!');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error("Sign-in error:", err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setToastMessage('Signed out. Local tracking active.');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error("Sign-out error:", err);
    }
  };

  // Featured Dish calculation based on date hash
  const todayString = new Date().toDateString();
  let hash = 0;
  for (let i = 0; i < todayString.length; i++) {
    hash = todayString.charCodeAt(i) + ((hash << 5) - hash);
  }
  const featuredIndex = recipes.length > 0 ? Math.abs(hash) % recipes.length : 0;
  const currentFeaturedDish = recipes[featuredIndex] || INITIAL_RECIPES[0];
  const isFeaturedInLibrary = recipes.some(r => r.name === currentFeaturedDish.name);

  const handleDeleteRecipe = (recipeId) => {
    const updated = recipes.filter(r => r.id !== recipeId);
    setRecipes(updated);
    syncToCloudAndLocal({ recipes: updated });
    setToastMessage('Recipe removed from library.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fasting Elapsed Timer
  const [fastingElapsed, setFastingElapsed] = useState(0);
  useEffect(() => {
    let interval;
    if (fastingState.active && fastingState.startTime) {
      interval = setInterval(() => {
        setFastingElapsed(Date.now() - fastingState.startTime);
      }, 1000);
    } else {
      setFastingElapsed(0);
    }
    return () => clearInterval(interval);
  }, [fastingState]);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Get active day data with custom overrides
  const defaultDay = SCHEDULE.find(d => d.id === selectedDay) || SCHEDULE[0];
  const activeCustom = customDays[selectedDay] || {};
  const currentWorkouts = activeCustom.workouts || defaultDay.workouts || [];
  const currentMeals = activeCustom.meals || defaultDay.meals || [];
  const targetCals = activeCustom.cals !== undefined ? activeCustom.cals : defaultDay.cals;
  const targetProtein = activeCustom.protein !== undefined ? activeCustom.protein : defaultDay.protein;

  const currentDayCompletion = completion[selectedDay] || {};

  const toggleTask = (taskId) => {
    const updatedCompletion = {
      ...completion,
      [selectedDay]: {
        ...(completion[selectedDay] || {}),
        [taskId]: !currentDayCompletion[taskId]
      }
    };
    setCompletion(updatedCompletion);
    syncToCloudAndLocal({ completion: updatedCompletion });
  };

  // Calculate Consumed Macros for active day
  const consumedMacros = currentMeals.reduce((acc, meal) => {
    if (currentDayCompletion[meal.id]) {
      acc.cals += (meal.cals || 0);
      acc.protein += (meal.protein || 0);
    }
    return acc;
  }, { cals: 0, protein: 0 });

  // Calculate Busy Dad Burpee minutes for the whole week
  const weeklyBdpMinutes = SCHEDULE.reduce((total, d) => {
    const dayWkts = customDays[d.id]?.workouts || d.workouts || [];
    const dayComp = completion[d.id] || {};
    dayWkts.forEach(w => {
      const isBdp = (w.name || '').toLowerCase().includes('busy dad') || (w.name || '').toLowerCase().includes('bdp');
      if (isBdp && dayComp[w.id]) {
        total += (w.minutes || 20);
      }
    });
    return total;
  }, 0);

  // Workout Handlers
  const handleRemoveWorkoutFromDay = (workoutId) => {
    const updatedWorkouts = currentWorkouts.filter(w => w.id !== workoutId);
    const updatedCustomDays = {
      ...customDays,
      [selectedDay]: { ...(customDays[selectedDay] || defaultDay), workouts: updatedWorkouts }
    };
    setCustomDays(updatedCustomDays);
    syncToCloudAndLocal({ customDays: updatedCustomDays });
  };

  const handleAddLibraryWorkoutToDay = () => {
    const libW = workoutLibrary.find(w => w.id === selectedWorkoutIdToAdd);
    if (!libW) return;
    const newDayWorkout = {
      id: `w-inst-${Date.now()}`,
      name: libW.name,
      minutes: libW.minutes,
      url: libW.url
    };
    const updatedCustomDays = {
      ...customDays,
      [selectedDay]: { ...(customDays[selectedDay] || defaultDay), workouts: [...currentWorkouts, newDayWorkout] }
    };
    setCustomDays(updatedCustomDays);
    syncToCloudAndLocal({ customDays: updatedCustomDays });
    setModalType(null);
  };

  const handleCreateNewGlobalWorkout = (e) => {
    e.preventDefault();
    if (!newLibWorkoutName.trim()) return;
    const newLibItem = {
      id: `lib-custom-${Date.now()}`,
      name: newLibWorkoutName.trim(),
      minutes: Number(newLibWorkoutMins) || 20,
      url: newLibWorkoutUrl.trim()
    };
    const updatedLibrary = [...workoutLibrary, newLibItem];
    setWorkoutLibrary(updatedLibrary);
    syncToCloudAndLocal({ workoutLibrary: updatedLibrary });
    setNewLibWorkoutName('');
    setNewLibWorkoutUrl('');
    setToastMessage('Added to Master Workout Library!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDeleteGlobalWorkout = (libId) => {
    const updatedLibrary = workoutLibrary.filter(w => w.id !== libId);
    setWorkoutLibrary(updatedLibrary);
    syncToCloudAndLocal({ workoutLibrary: updatedLibrary });
    setToastMessage('Workout removed from global library.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRemoveMeal = (mealId) => {
    const updatedMeals = currentMeals.filter(m => m.id !== mealId);
    const updatedCustomDays = {
      ...customDays,
      [selectedDay]: { ...(customDays[selectedDay] || defaultDay), meals: updatedMeals }
    };
    setCustomDays(updatedCustomDays);
    syncToCloudAndLocal({ customDays: updatedCustomDays });
  };

  const handleAddRecipeMeal = () => {
    const r = recipes.find(item => item.id === selectedRecipeToAdd);
    if (!r) return;
    const newMeal = {
      id: `m-${Date.now()}`,
      name: r.name,
      cals: r.cals,
      protein: r.protein,
      carbs: r.carbs,
      fat: r.fat
    };
    const updatedCustomDays = {
      ...customDays,
      [selectedDay]: { ...(customDays[selectedDay] || defaultDay), meals: [...currentMeals, newMeal] }
    };
    setCustomDays(updatedCustomDays);
    syncToCloudAndLocal({ customDays: updatedCustomDays });
    setModalType(null);
  };

  const handleSaveGoals = (e) => {
    e.preventDefault();
    const cals = parseInt(e.target.cals.value, 10) || 0;
    const protein = parseInt(e.target.protein.value, 10) || 0;
    const updatedCustomDays = {
      ...customDays,
      [selectedDay]: { ...(customDays[selectedDay] || defaultDay), cals, protein }
    };
    setCustomDays(updatedCustomDays);
    syncToCloudAndLocal({ customDays: updatedCustomDays });
    setModalType(null);
  };

  // Recipe Categories
  const categories = ['All', 'Eggs', 'Beef', 'Fish', 'Poultry'];
  const filteredRecipes = recipeCategory === 'All' 
    ? recipes 
    : recipes.filter(r => r.category === recipeCategory);

  // Weight Calculations (Supports Lost & Gained)
  const weightDiff = weightData.start - weightData.current;
  const isWeightLost = weightDiff >= 0;
  const absWeightDiff = Math.abs(weightDiff).toFixed(1);
  const totalToLose = weightData.start - weightData.goal;
  const weightProgress = totalToLose > 0 
    ? Math.max(0, Math.min(100, Math.round((weightDiff / totalToLose) * 100)))
    : 0;

  return (
    <div className="max-w-md mx-auto min-h-screen text-slate-800 flex flex-col font-sans pb-12 shadow-xl border-x border-[#e2e2e2] bg-white">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <Icons.Check size={14} style={{ color: '#82bc41' }} /> {toastMessage}
        </div>
      )}

      {/* Header Area - Clean Unified Top Bar */}
      <header className="bg-white px-5 pt-4 pb-3 border-b border-[#eaeaea] sticky top-0 z-30">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 m-0 uppercase">Keto Shred Tracker</h1>
            <p className="text-[10px] font-bold tracking-wider mt-0.5 text-slate-500">Joint-Friendly Fat Loss • 61yo Protocol</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setModalType('weight')}
              className="text-right px-3 py-1.5 rounded-xl border border-[#e2e2e2] bg-white transition-all hover:bg-slate-50 shadow-xs"
            >
              <span className="block text-sm font-black leading-none" style={{ color: '#82bc41' }}>
                {absWeightDiff} lbs
              </span>
              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">
                {isWeightLost ? 'Lost' : 'Gained'}
              </span>
            </button>

            {/* Cloud Sync / Login Button */}
            {!user ? (
              <button
                onClick={handleGoogleSignIn}
                className="px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 text-white shadow-xs transition-all hover:opacity-90"
                style={{ backgroundColor: '#82bc41' }}
                title="Sign in with Google to save your profile to the cloud"
              >
                <Icons.Cloud size={14} /> Cloud Save
              </button>
            ) : (
              <button
                onClick={handleSignOut}
                className="p-2 rounded-xl border border-[#e2e2e2] bg-white hover:bg-slate-50 text-slate-600 transition-colors"
                title={`Signed in as ${user.email}. Click to Sign Out.`}
              >
                <Icons.LogOut size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation - Seamless Bar */}
        <div className="flex border-b border-[#eaeaea] -mx-5 px-5 gap-6">
          {[
            { id: 'dashboard', icon: Icons.Activity, label: 'Dash' },
            { id: 'schedule', icon: Icons.Calendar, label: 'Schedule' },
            { id: 'recipes', icon: Icons.BookOpen, label: 'Recipes' },
            { id: 'fasting', icon: Icons.Clock, label: 'Fasting' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 py-2.5 text-xs font-bold transition-all border-b-2 -mb-[1px] ${
                activeTab === tab.id ? 'text-slate-900' : 'text-slate-500 border-transparent hover:text-slate-900'
              }`}
              style={activeTab === tab.id ? { borderColor: '#82bc41' } : {}}
            >
              <tab.icon size={14} style={activeTab === tab.id ? { color: '#82bc41' } : {}} />
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="px-4 py-4 flex-1 space-y-4">

        {/* Cloud Save Prompt Banner for Local Mode Users */}
        {!user && (
          <div className="bg-[#fafafa] border border-[#eaeaea] rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-black text-slate-900 block">Local Storage Mode Active</span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Sign in with your Google account to save your profile, meal logs, and custom schedules to the cloud.
              </p>
            </div>
            <button
              onClick={handleGoogleSignIn}
              className="px-3.5 py-2 text-white text-xs font-black rounded-xl shadow-xs shrink-0 transition-all hover:opacity-90"
              style={{ backgroundColor: '#82bc41' }}
            >
              Sign In with Google
            </button>
          </div>
        )}
        
        {/* SCHEDULE TAB */}
        {activeTab === 'schedule' && (
          <div className="bg-white rounded-2xl border border-[#eaeaea] shadow-xs overflow-hidden">
            
            {/* 7-Day Horizontal Bar */}
            <div className="grid grid-cols-7 border-b border-[#eaeaea] bg-[#fafafa]">
              {SCHEDULE.map(d => {
                const isSelected = selectedDay === d.id;
                const isRealToday = todayId === d.id;
                const dayWkts = customDays[d.id]?.workouts || d.workouts || [];
                const dayComp = completion[d.id] || {};
                const allWktsDone = dayWkts.length > 0 && dayWkts.every(w => dayComp[w.id]);

                return (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDay(d.id)}
                    className={`py-3 text-center flex flex-col items-center justify-center transition-all border-r border-[#eaeaea] last:border-r-0 ${
                      isSelected ? 'bg-white font-bold' : 'hover:bg-slate-100/60 text-slate-500'
                    }`}
                    style={isSelected ? { borderBottom: '2px solid #82bc41', color: '#000' } : {}}
                  >
                    <span className="text-[10px] uppercase tracking-wider">{d.dayName.slice(0, 3)}</span>
                    <div className="h-3 flex items-center justify-center mt-1">
                      {allWktsDone ? (
                        <span className="text-[10px] font-black" style={{ color: '#82bc41' }}>✓</span>
                      ) : isRealToday ? (
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#82bc41' }} />
                      ) : (
                        <div className="w-1 h-1 rounded-full bg-slate-300" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Daily Body Section */}
            <div className="p-5 space-y-6">
              
              {/* Day Header & Macros */}
              <div className="flex justify-between items-center pb-4 border-b border-[#eaeaea]">
                <div>
                  <h2 className="text-base font-black text-slate-900">{defaultDay.dayName}</h2>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {defaultDay.dayType} Protocol
                  </span>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div>
                    <span className="block text-xs font-black" style={{ color: '#82bc41' }}>{targetCals} kcal</span>
                    <span className="text-[9px] text-slate-500 font-bold uppercase">{targetProtein}g Protein</span>
                  </div>
                  <button 
                    onClick={() => setModalType('goals')} 
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    title="Edit Goals"
                  >
                    <Icons.Settings size={14} />
                  </button>
                </div>
              </div>

              {/* Training Routine Subsection */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Training Routine</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setModalType('manageWorkouts')} 
                      className="text-[10px] font-extrabold text-slate-700 hover:text-slate-900 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200"
                    >
                      Library
                    </button>
                    <button 
                      onClick={() => setModalType('workout')} 
                      className="text-[10px] font-extrabold flex items-center gap-1 hover:underline"
                      style={{ color: '#82bc41' }}
                    >
                      <Icons.Plus size={12} /> Assign
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {currentWorkouts.map(w => {
                    const isChecked = !!currentDayCompletion[w.id];
                    return (
                      <div 
                        key={w.id}
                        className={`flex items-start justify-between p-3 rounded-xl border transition-all ${
                          isChecked ? 'bg-slate-50 border-slate-200 opacity-50' : 'bg-white border-[#eaeaea]'
                        }`}
                      >
                        <label className="flex items-start gap-3 cursor-pointer flex-1 mr-2">
                          <input 
                            type="checkbox" 
                            checked={isChecked} 
                            onChange={() => toggleTask(w.id)}
                            className="mt-0.5 w-4 h-4 rounded border-slate-300"
                            style={{ accentColor: '#82bc41' }} 
                          />
                          <div>
                            <span className={`text-xs font-bold block ${isChecked ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                              {w.name}
                            </span>
                            {w.url && (
                              <a 
                                href={w.url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="inline-flex items-center gap-1 mt-1 text-[9px] font-bold text-slate-600 hover:text-slate-900"
                              >
                                <Icons.Youtube className="w-3 h-3 text-red-600" /> Watch Video
                              </a>
                            )}
                          </div>
                        </label>
                        <button onClick={() => handleRemoveWorkoutFromDay(w.id)} className="text-slate-400 hover:text-red-500">
                          <Icons.Trash size={13} />
                        </button>
                      </div>
                    );
                  })}
                  {currentWorkouts.length === 0 && (
                    <div className="p-3 text-center text-xs text-slate-500 bg-[#fafafa] rounded-xl border border-dashed border-[#eaeaea]">
                      No workouts scheduled.
                    </div>
                  )}
                </div>
              </div>

              {/* Nutrition Subsection */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nutrition & Meals</span>
                  {defaultDay.dayType !== 'fasting' && (
                    <button 
                      onClick={() => setModalType('meal')} 
                      className="text-[10px] font-extrabold flex items-center gap-1 hover:underline"
                      style={{ color: '#82bc41' }}
                    >
                      <Icons.Plus size={12} /> Add Meal
                    </button>
                  )}
                </div>

                {defaultDay.dayType === 'fasting' ? (
                  <div className="p-3.5 rounded-xl bg-[#fafafa] border border-[#eaeaea]">
                    <div className="text-xs font-black text-slate-900 mb-0.5">Strict Fasting Protocol Active</div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Zero calories today. Stay hydrated with electrolytes and black coffee.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Consumed Progress Bar */}
                    <div className="bg-[#fafafa] p-3 rounded-xl border border-[#eaeaea] mb-3">
                      <div className="flex justify-between text-[11px] font-bold text-slate-700 mb-1.5">
                        <span>Consumed: <strong style={{ color: '#82bc41' }}>{consumedMacros.cals}</strong> / {targetCals} kcal</span>
                        <span><strong style={{ color: '#82bc41' }}>{consumedMacros.protein}g</strong> / {targetProtein}g Pro</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, targetCals > 0 ? (consumedMacros.cals / targetCals) * 100 : 0)}%`, backgroundColor: '#82bc41' }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      {currentMeals.map(m => {
                        const isChecked = !!currentDayCompletion[m.id];
                        return (
                          <div 
                            key={m.id}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                              isChecked ? 'bg-slate-50 border-slate-200 opacity-50' : 'bg-white border-[#eaeaea]'
                            }`}
                          >
                            <label className="flex items-center gap-3 cursor-pointer flex-1 mr-2">
                              <input 
                                type="checkbox" 
                                checked={isChecked} 
                                onChange={() => toggleTask(m.id)}
                                className="w-4 h-4 rounded border-slate-300" 
                                style={{ accentColor: '#82bc41' }}
                              />
                              <div>
                                <span className={`text-xs font-bold block ${isChecked ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                                  {m.name}
                                </span>
                                <span className="text-[9px] text-slate-500 font-bold">
                                  {m.cals} kcal • {m.protein}g Protein
                                </span>
                              </div>
                            </label>
                            <button onClick={() => handleRemoveMeal(m.id)} className="text-slate-400 hover:text-red-500">
                              <Icons.Trash size={13} />
                            </button>
                          </div>
                        );
                      })}
                      {currentMeals.length === 0 && (
                        <div className="p-3 text-center text-xs text-slate-500 bg-[#fafafa] rounded-xl border border-dashed border-[#eaeaea]">
                          No meals assigned.
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

            </div>
          </div>
        )}

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-3">
            
            {/* Weight Loss Progress */}
            <div className="bg-white rounded-2xl border border-[#eaeaea] p-5 shadow-xs">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Weight Goal Progress</span>
                <button onClick={() => setModalType('weight')} className="text-[10px] font-bold hover:underline" style={{ color: '#82bc41' }}>Update</button>
              </div>
              <div className="flex items-baseline justify-between mb-2">
                <div>
                  <span className="text-2xl font-black text-slate-900">{weightData.current}</span>
                  <span className="text-xs text-slate-500 font-bold ml-1">lbs</span>
                </div>
                <div className="text-xs text-slate-600 font-bold">
                  Target: {weightData.goal} lbs
                </div>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-2">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${weightProgress}%`, backgroundColor: '#82bc41' }} />
              </div>
              <div className="flex justify-between text-[10px] font-bold text-slate-500">
                <span>Start: {weightData.start} lbs</span>
                <span style={{ color: isWeightLost ? '#82bc41' : '#e11d48' }}>
                  {isWeightLost ? `${weightProgress}% completed (${absWeightDiff} lbs lost)` : `${absWeightDiff} lbs gained`}
                </span>
              </div>
            </div>

            {/* Busy Dad Burpee Progress */}
            <div className="bg-white rounded-2xl border border-[#eaeaea] p-5 shadow-xs">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Weekly BDP Goal</span>
                <span className="text-xs font-black" style={{ color: '#82bc41' }}>{weeklyBdpMinutes} / 80 Mins</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-2">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (weeklyBdpMinutes / 80) * 100)}%`, backgroundColor: '#82bc41' }} 
                />
              </div>
              {weeklyBdpMinutes >= 80 ? (
                <div className="text-xs font-bold text-emerald-600">✓ 80-Minute Weekly Burpee Benchmark Reached!</div>
              ) : (
                <p className="text-[11px] text-slate-600">Complete your four 20-minute sessions to hit your weekly conditioning target.</p>
              )}
            </div>

            {/* Featured Joint-Health Dish (Dark Slate Background Restored) */}
            <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-5 shadow-md">
              <div className="flex justify-between items-start mb-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
                  Featured Internet Dish • {currentFeaturedDish.category}
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  {currentFeaturedDish.cals} kcal • {currentFeaturedDish.protein}g Pro
                </span>
              </div>

              <h3 className="text-sm font-black text-white mb-1">{currentFeaturedDish.name}</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">{currentFeaturedDish.ingredients.join(', ')}</p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <button 
                  onClick={() => setActiveRecipeModal(currentFeaturedDish)}
                  className="text-xs font-bold hover:underline flex items-center gap-1 text-emerald-400"
                >
                  View Full Recipe <Icons.ExternalLink size={12} />
                </button>

                {!isFeaturedInLibrary && (
                  <button
                    onClick={() => {
                      const newRecipeItem = {
                        id: `feat-lib-${Date.now()}`,
                        name: currentFeaturedDish.name,
                        category: currentFeaturedDish.category,
                        cals: currentFeaturedDish.cals,
                        protein: currentFeaturedDish.protein,
                        carbs: currentFeaturedDish.carbs,
                        fat: currentFeaturedDish.fat,
                        ingredients: currentFeaturedDish.ingredients,
                        instructions: currentFeaturedDish.instructions
                      };
                      const updatedRecipes = [newRecipeItem, ...recipes];
                      setRecipes(updatedRecipes);
                      syncToCloudAndLocal({ recipes: updatedRecipes });
                      setToastMessage('Added to your Recipe Library!');
                      setTimeout(() => setToastMessage(null), 3000);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 text-white shadow-xs"
                    style={{ backgroundColor: '#82bc41' }}
                  >
                    <Icons.Plus size={13} /> Add to Library
                  </button>
                )}
                {isFeaturedInLibrary && (
                  <span className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 bg-emerald-950 text-emerald-300 border border-emerald-800">
                    <Icons.Check size={13} style={{ color: '#82bc41' }} /> In Library
                  </span>
                )}
              </div>
            </div>

            {/* Protocol Rules */}
            <div className="bg-white rounded-2xl border border-[#eaeaea] p-5 shadow-xs">
              <h3 className="text-xs font-black text-slate-900 mb-2 uppercase tracking-wider">Protocol Anchors</h3>
              <ul className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
                <li>• Maintain 155g–175g daily protein on eating days to defend muscle mass.</li>
                <li>• Dedicate Tuesdays and Thursdays strictly to Leo Moves mobility and joint decompression.</li>
                <li>• Butter, cheeses, and eggs remain staples for clean ketogenic fats.</li>
              </ul>
            </div>

          </div>
        )}

        {/* RECIPES TAB */}
        {activeTab === 'recipes' && (
          <div className="space-y-3">
            
            {/* Category Filter Pills */}
            <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setRecipeCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    recipeCategory === cat ? 'text-white shadow-xs' : 'bg-white border border-[#eaeaea] text-slate-700 hover:bg-slate-50'
                  }`}
                  style={recipeCategory === cat ? { backgroundColor: '#82bc41' } : {}}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Recipe List */}
            <div className="space-y-2.5">
              {filteredRecipes.map(recipe => (
                <div key={recipe.id} className="bg-white rounded-2xl border border-[#eaeaea] p-4 shadow-xs">
                  <div className="flex justify-between items-start mb-1.5">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block mb-0.5">
                        {recipe.category}
                      </span>
                      <h3 className="text-xs font-black text-slate-900">{recipe.name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setActiveRecipeModal(recipe)}
                        className="text-slate-700 hover:text-slate-900 p-1 bg-slate-100 rounded-lg border border-slate-200 text-[10px] font-bold px-2 py-1 flex items-center gap-1"
                      >
                        View <Icons.ExternalLink size={11} />
                      </button>
                      <button 
                        onClick={() => handleDeleteRecipe(recipe.id)}
                        className="text-slate-400 hover:text-red-600 p-1 bg-slate-100 rounded-lg border border-slate-200"
                        title="Delete Recipe"
                      >
                        <Icons.Trash size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    <span style={{ color: '#82bc41' }}>{recipe.cals} KCAL</span>
                    <span>• {recipe.protein}g PRO</span>
                    <span>• {recipe.carbs}g CARB</span>
                  </div>

                  <p className="text-xs text-slate-600 bg-[#fafafa] p-2.5 rounded-xl border border-[#eaeaea] leading-relaxed line-clamp-2">
                    {recipe.instructions}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FASTING TAB */}
        {activeTab === 'fasting' && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl border border-[#eaeaea] p-6 shadow-xs text-center">
              <Icons.Clock className={`w-10 h-10 mx-auto mb-2 text-slate-400 ${fastingState.active ? 'animate-pulse' : ''}`} style={fastingState.active ? { color: '#82bc41' } : {}} />
              
              <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                {fastingState.active ? 'Active Fasting Window' : 'Fast Not Started'}
              </h2>
              
              <div className="text-3xl font-black text-slate-900 tracking-tight tabular-nums my-2">
                {formatTime(fastingElapsed)}
              </div>

              <div className="text-xs font-bold text-slate-700 mb-5">
                Target Preset: {fastingState.preset} Hours
              </div>

              {!fastingState.active ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {[18, 36, 48].map(hrs => (
                      <button
                        key={hrs}
                        onClick={() => {
                          const updated = { ...fastingState, preset: hrs };
                          setFastingState(updated);
                          syncToCloudAndLocal({ fastingState: updated });
                        }}
                        className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                          fastingState.preset === hrs ? 'text-white border-transparent' : 'bg-white text-slate-700 border-[#eaeaea]'
                        }`}
                        style={fastingState.preset === hrs ? { backgroundColor: '#82bc41' } : {}}
                      >
                        {hrs === 18 ? '18:6' : `${hrs}h ADF`}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => {
                      const updated = { ...fastingState, active: true, startTime: Date.now() };
                      setFastingState(updated);
                      syncToCloudAndLocal({ fastingState: updated });
                    }}
                    className="w-full py-3 text-white rounded-xl font-black tracking-wide shadow-xs transition-all"
                    style={{ backgroundColor: '#82bc41' }}
                  >
                    START FAST
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => {
                    const updated = { ...fastingState, active: false, startTime: null };
                    setFastingState(updated);
                    syncToCloudAndLocal({ fastingState: updated });
                  }}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 border border-[#eaeaea] rounded-xl font-black tracking-wide transition-all"
                >
                  END FAST
                </button>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-[#eaeaea] p-4 shadow-xs">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Icons.Flame className="w-4 h-4" style={{ color: '#82bc41' }} />
                <span className="text-xs font-black text-slate-900">Transition Phase Helper</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Break prolonged 36h/48h fasts with easily digestible proteins or bone broth 45 minutes before a substantial meal to safeguard digestion and prevent insulin surges.
              </p>
            </div>
          </div>
        )}

      </main>

      {/* --- MODALS --- */}

      {/* Recipe Detail Modal */}
      {activeRecipeModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-[#eaeaea] shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                  {activeRecipeModal.category} Recipe
                </span>
                <h3 className="text-base font-black text-slate-900">{activeRecipeModal.name}</h3>
              </div>
              <button onClick={() => setActiveRecipeModal(null)} className="text-slate-400 hover:text-slate-900">
                <Icons.X size={18} />
              </button>
            </div>

            <div className="flex gap-3 text-xs font-extrabold text-slate-900 mb-4 bg-slate-100 p-2.5 rounded-xl border border-slate-200">
              <span style={{ color: '#82bc41' }}>{activeRecipeModal.cals} KCAL</span>
              <span>• {activeRecipeModal.protein}g Protein</span>
              <span>• {activeRecipeModal.carbs}g Carbs</span>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">Ingredients</span>
                <ul className="list-disc pl-4 text-xs text-slate-800 space-y-1 font-medium bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  {activeRecipeModal.ingredients?.map((ing, idx) => (
                    <li key={idx}>{ing}</li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">Cooking Instructions</span>
                <p className="text-xs text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-200 font-medium">
                  {activeRecipeModal.instructions}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {!recipes.some(r => r.name === activeRecipeModal.name) && (
                <button 
                  onClick={() => {
                    const updatedRecipes = [{ ...activeRecipeModal, id: `modal-lib-${Date.now()}` }, ...recipes];
                    setRecipes(updatedRecipes);
                    syncToCloudAndLocal({ recipes: updatedRecipes });
                    setToastMessage('Added to your Recipe Library!');
                    setTimeout(() => setToastMessage(null), 3000);
                    setActiveRecipeModal(null);
                  }}
                  className="flex-1 py-3 text-white text-xs font-black rounded-xl shadow-sm"
                  style={{ backgroundColor: '#82bc41' }}
                >
                  Save to Library
                </button>
              )}
              <button 
                onClick={() => setActiveRecipeModal(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold rounded-xl border border-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Goals Modal */}
      {modalType === 'goals' && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm border border-[#eaeaea] shadow-xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-black text-slate-900">Edit Goals for {defaultDay.dayName}</h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-900">
                <Icons.X size={15} />
              </button>
            </div>
            <form onSubmit={handleSaveGoals} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Target Calories (kcal)</label>
                <input 
                  type="number" 
                  name="cals" 
                  defaultValue={targetCals}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-[#fafafa] font-bold text-slate-900 text-xs mt-1 focus:outline-none" 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Target Protein (grams)</label>
                <input 
                  type="number" 
                  name="protein" 
                  defaultValue={targetProtein}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-[#fafafa] font-bold text-slate-900 text-xs mt-1 focus:outline-none" 
                />
              </div>
              <button 
                type="submit" 
                className="w-full py-2.5 text-white font-bold rounded-xl text-xs tracking-wide shadow-xs"
                style={{ backgroundColor: '#82bc41' }}
              >
                Save Goals
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Assign Workout Modal */}
      {modalType === 'workout' && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm border border-[#eaeaea] shadow-xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-black text-slate-900">Assign Workout to {defaultDay.dayName}</h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-900">
                <Icons.X size={15} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Choose from Master Library</label>
                <select 
                  value={selectedWorkoutIdToAdd}
                  onChange={(e) => setSelectedWorkoutIdToAdd(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-[#fafafa] focus:outline-none"
                >
                  {workoutLibrary.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.minutes}m)
                    </option>
                  ))}
                </select>
              </div>
              <button 
                onClick={handleAddLibraryWorkoutToDay}
                className="w-full py-2.5 text-white font-bold rounded-xl text-xs tracking-wide shadow-xs"
                style={{ backgroundColor: '#82bc41' }}
              >
                Add to {defaultDay.dayName}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Manage Master Workout Library Modal */}
      {modalType === 'manageWorkouts' && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm border border-[#eaeaea] shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-black text-slate-900">Master Workout Library</h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-900">
                <Icons.X size={15} />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              {workoutLibrary.map(w => (
                <div key={w.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-xs font-bold block text-slate-900">{w.name}</span>
                    <span className="text-[9px] text-slate-500">{w.minutes} minutes</span>
                  </div>
                  <button onClick={() => handleDeleteGlobalWorkout(w.id)} className="text-slate-400 hover:text-red-600 p-1">
                    <Icons.Trash size={13} />
                  </button>
                </div>
              ))}
            </div>

            <hr className="border-slate-200 my-3" />

            <form onSubmit={handleCreateNewGlobalWorkout} className="space-y-2.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 block">Add New Global Workout</span>
              <div>
                <input 
                  type="text" 
                  placeholder="Workout Name (e.g. Core HIIT)"
                  value={newLibWorkoutName}
                  onChange={(e) => setNewLibWorkoutName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="number" 
                  placeholder="Mins"
                  value={newLibWorkoutMins}
                  onChange={(e) => setNewLibWorkoutMins(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:outline-none"
                />
                <input 
                  type="url" 
                  placeholder="YouTube URL"
                  value={newLibWorkoutUrl}
                  onChange={(e) => setNewLibWorkoutUrl(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:outline-none"
                />
              </div>
              <button 
                type="submit" 
                className="w-full py-2.5 text-white font-bold rounded-xl text-xs shadow-xs"
                style={{ backgroundColor: '#82bc41' }}
              >
                Add to Master Library
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. Meal Modal */}
      {modalType === 'meal' && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm border border-[#eaeaea] shadow-xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-black text-slate-900">Add Meal from Recipe Book</h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-900">
                <Icons.X size={15} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Choose Recipe</label>
                <select 
                  value={selectedRecipeToAdd}
                  onChange={(e) => setSelectedRecipeToAdd(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-[#fafafa] focus:outline-none"
                >
                  {recipes.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.cals} kcal, {r.protein}g P)
                    </option>
                  ))}
                </select>
              </div>
              <button 
                onClick={handleAddRecipeMeal}
                className="w-full py-2.5 text-white font-bold rounded-xl text-xs tracking-wide shadow-xs"
                style={{ backgroundColor: '#82bc41' }}
              >
                Add Meal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Weight Tracker Modal */}
      {modalType === 'weight' && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm border border-[#eaeaea] shadow-xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-black text-slate-900">Update Weight Profile</h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-900">
                <Icons.X size={15} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Starting Weight (lbs)</label>
                <input 
                  type="number" 
                  value={weightData.start}
                  onChange={(e) => {
                    const updated = { ...weightData, start: parseFloat(e.target.value) || 0 };
                    setWeightData(updated);
                    syncToCloudAndLocal({ weightData: updated });
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-[#fafafa] font-bold text-slate-900 text-xs mt-1 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Current Weight (lbs)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={weightData.current}
                  onChange={(e) => {
                    const updated = { ...weightData, current: parseFloat(e.target.value) || 0 };
                    setWeightData(updated);
                    syncToCloudAndLocal({ weightData: updated });
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-[#fafafa] font-bold text-slate-900 text-xs mt-1 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Goal Weight (lbs)</label>
                <input 
                  type="number" 
                  value={weightData.goal}
                  onChange={(e) => {
                    const updated = { ...weightData, goal: parseFloat(e.target.value) || 0 };
                    setWeightData(updated);
                    syncToCloudAndLocal({ weightData: updated });
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-[#fafafa] font-bold text-slate-900 text-xs mt-1 focus:outline-none"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button 
                  type="button"
                  onClick={() => {
                    const updated = { start: 205, current: 205, goal: 180 };
                    setWeightData(updated);
                    syncToCloudAndLocal({ weightData: updated });
                    setToastMessage('Weight tracker reset.');
                    setTimeout(() => setToastMessage(null), 3000);
                    setModalType(null);
                  }}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all border border-slate-200"
                >
                  Reset
                </button>
                <button 
                  type="button"
                  onClick={() => setModalType(null)}
                  className="flex-1 py-2.5 text-white font-bold rounded-xl text-xs tracking-wide shadow-xs"
                  style={{ backgroundColor: '#82bc41' }}
                >
                  Save Weight Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
