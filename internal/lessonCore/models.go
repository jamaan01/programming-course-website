package lessonCore

type Lesson struct {
	ID       int    `json:"id"`
	ModuleID int    `json:"module_id"`
	Title    string `json:"title"`
	Content  string `json:"content"`
	OrderNum int    `json:"order_num"`
}
