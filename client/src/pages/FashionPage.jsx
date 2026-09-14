import React from "react";

import CategoryPage from "../features/categories/Component/Categories";
import { categoryPages } from "../features/categories/CategoriesData";

function Fashion() {
    return <CategoryPage data={categoryPages.fashion} />;
}

export default Fashion;