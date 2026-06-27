package courseCore

import "time"

type Course struct {
	ID          int      `json:"id"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	IsPublished bool     `json:"is_published"`
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

type CreateCourseRequest struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description" binding:"required"`
}

type CreateModuleRequest struct {
	Title    string `json:"title" binding:"required"`
	OrderNum int    `json:"order_num"`
}

type CreateLessonRequest struct {
	Title    string `json:"title" binding:"required"`
	Content  string `json:"content" binding:"required"`
	OrderNum int    `json:"order_num"`
}

type UpdateCoursePublishRequest struct {
	IsPublished *bool `json:"is_published"`
}

type UpdateCourseRequest struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description" binding:"required"`
}

type UpdateModuleRequest struct {
	Title string `json:"title" binding:"required"`
}

type UpdateLessonRequest struct {
	Title   string `json:"title" binding:"required"`
	Content string `json:"content" binding:"required"`
}

type CourseAccess struct {
	ID          int        `json:"id"`
	UserID      int        `json:"user_id"`
	UserEmail   string     `json:"user_email"`
	UserName    string     `json:"user_name"`
	CourseID    int        `json:"course_id"`
	CourseTitle string     `json:"course_title"`
	GrantedBy   *int       `json:"granted_by,omitempty"`
	IsActive    bool       `json:"is_active"`
	GrantedAt   time.Time  `json:"granted_at"`
	RevokedAt   *time.Time `json:"revoked_at,omitempty"`
}

type GrantCourseAccessRequest struct {
	UserEmail string `json:"user_email"`
	UserID    int    `json:"user_id"`
	CourseID  int    `json:"course_id" binding:"required"`
}

type CourseAccessCheckResponse struct {
	HasAccess bool `json:"has_access"`
	IsAdmin   bool `json:"is_admin"`
}
