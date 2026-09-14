import React from "react";

import CategoryPage from "../features/categories/Component/Categories";
import { categoryPages } from "../features/categories/CategoriesData";

function Beauty() {
    return <CategoryPage data={categoryPages.beauty} />;
}

export default Beauty;