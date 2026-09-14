import React from "react";

import CategoryPage from "../features/categories/Component/Categories";
import { categoryPages } from "../features/categories/CategoriesData";

function Accessories() {
    return (
        <CategoryPage
            data={categoryPages.accessories}
        />
    );
}

export default Accessories;