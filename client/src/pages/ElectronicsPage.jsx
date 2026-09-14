import React from "react";

import CategoryPage from "../features/categories/Component/Categories";
import { categoryPages } from "../features/categories/CategoriesData";

function Electronics() {
    return (
        <CategoryPage
            data={categoryPages.electronics}
        />
    );
}

export default Electronics;