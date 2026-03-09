package courseCore

type Course struct {
	ID          int      `json:"id"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Modules     []Module `json:"modules,omitempty"`
}

type Module struct {
	ID       int      `json:"id"`
	CourseID int      `json:"course_id"`
	Title    string   `json:"title"`
	OrderNum int      `json:"order_num"`
	Lessons  []Lesson `json:"lessons,omitempty"`
}

type Lesson struct {
	ID       int    `json:"id"`
	ModuleID int    `json:"module_id"`
	Title    string `json:"title"`
	Content  string `json:"content,omitempty"`
	OrderNum int    `json:"order_num"`
}
