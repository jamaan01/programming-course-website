package courseCore

type Course struct {
	ID          int    `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
}

type Lessons struct {
	ID            int    `json:"id"`
	CourseID      int    `json:"course_id"`
	SelectionName string `json:"selection_name"`
	Title         string `json:"title"`
	Content       string `json:"content"`
	Homework      string `json:"homework"`
	OrderNum      int    `json:"order_num"`
}
