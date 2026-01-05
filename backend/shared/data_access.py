from sqlalchemy import create_engine, text
import urllib
import re


class DataAccess:

    params = urllib.parse.quote_plus(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=192.168.1.164;"
        "DATABASE=MVPFastPass;"
        "TrustServerCertificate=yes;"
        "UID=AppUser;"
        "PWD=uiyhqet@er%$^to#$qwoui&*"
    )

    # connection_string = "DRIVER={ODBC Driver 17 for SQL Server};Server=localhost; Database=DotNetCourseDatabase; Trusted_Connection=true; TrustServerCertificate=true"

    # engine = create_engine(f"mssql+pyodbc:///?odbc_connect={connection_string}")
    engine = create_engine(f"mssql+pyodbc:///?odbc_connect={params}")

    @staticmethod
    def pascal_to_camel(string):
        return string[0].lower() + string[1:] if string else string
    
    def convert_pascal_dict_keys_to_camel(self, dict):
        return {self.pascal_to_camel(key): value for key, value in dict.items()}
    
    def pascal_rows_to_camel_dict(self, rows):
        return [self.convert_pascal_dict_keys_to_camel(dict(row._asdict())) for row in rows]
    
    def pascal_rows_to_camel_dict_from_multi(self, cursor, rows):
        columns = [col[0] for col in cursor.description]
        return [self.convert_pascal_dict_keys_to_camel(dict(zip(columns, row))) for row in rows]
    
    @staticmethod
    def convert_to_snake(string):
        string = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', string) 
        string = re.sub('([a-z0-9])([A-Z])', r'\1_\2', string)
        return string.lower()
    
    def convert_dict_keys_to_snake(self, dict):
        return {self.convert_to_snake(key): value for key, value in dict.items()}
    
    def rows_to_snake_dict(self, rows):
        return [self.convert_dict_keys_to_snake(dict(row._asdict())) for row in rows]
    

    def load_query(self, sql):
        sqlText = text("SET NOCOUNT ON;" + sql)
        with self.engine.connect() as conn:
            result = conn.execute(sqlText)
            result_rows = result.fetchall()
            return self.pascal_rows_to_camel_dict(result_rows)


    def load_query_with_params(self, sql, params):
        sqlText = text("SET NOCOUNT ON;" + sql)
        with self.engine.connect() as conn:
            result = conn.execute(sqlText, params)
            result_rows = result.fetchall()
            # return [dict(row._asdict()) for row in result_rows]
            return self.pascal_rows_to_camel_dict(result_rows)
        
        
    def load_query_single(self, sql):
        sqlText = text("SET NOCOUNT ON;" + sql)
        with self.engine.connect() as conn:
            result = conn.execute(sqlText)
            result_row = result.fetchone()
            return self.convert_pascal_dict_keys_to_camel(dict(result_row._asdict()))
        
        
    def load_query_single_with_params(self, sql, params):
        sqlText = text("SET NOCOUNT ON;" + sql)
        with self.engine.connect() as conn:
            result = conn.execute(sqlText, params)
            result_row = result.fetchone()
            # return dict(result_row._asdict()) 
            return self.convert_pascal_dict_keys_to_camel(dict(result_row._asdict()))
        
        
    def load_query_multi(self, sql):
        sqlText = text("SET NOCOUNT ON;" + sql)
        conn = self.engine.raw_connection()
        try:
            cursor = conn.cursor()
            result = cursor.execute(sqlText)
            # result = conn.execution_options(stream_results=True).execute(sqlText)
            print(result)
            results_object = []
            
            while True:
                result_rows = cursor.fetchall()
                
                results_object.append(self.pascal_rows_to_camel_dict_from_multi(cursor, result_rows))
                
                if not cursor.nextset():
                    break
                
        finally:
            conn.close()
            
        return results_object
    
        
    def load_query_multi_with_params(self, sql, params):
        sqlText = text("SET NOCOUNT ON;" + sql)
        conn = self.engine.raw_connection()
        try:
            cursor = conn.cursor()
            result = cursor.execute(sqlText, params)
            # result = conn.execution_options(stream_results=True).execute(sqlText)
            print(result)
            results_object = []
            
            while True:
                result_rows = cursor.fetchall()
                
                results_object.append(self.pascal_rows_to_camel_dict_from_multi(cursor, result_rows))
                
                if not cursor.nextset():
                    break
                
        finally:
            conn.close()
            
        return results_object


    def execute_query(self, sql):
        sqlText = text(sql)
        #Using begin commits changes to DB
        with self.engine.begin() as conn:
            result = conn.execute(sqlText)
            
            return {"message": "Row inserted successfully", "rows_affected": result.rowcount}


    def execute_query_with_params(self, sql, params):
        sqlText = text(sql)
        #Using begin commits changes to DB
        with self.engine.begin() as conn:
            result = conn.execute(sqlText, params)
            
            return {"message": "Row inserted successfully", "rows_affected": result.rowcount}

        
    def execute_query_with_results(self, sql):
        sqlText = "SET NOCOUNT ON;" + sql
        
        conn = self.engine.raw_connection()
        try:
            cursor = conn.cursor()
            result = cursor.execute(sqlText)
            # result = conn.execution_options(stream_results=True).execute(sqlText)
            print(result)
            results_object = []
            
            while True:
                result_rows = cursor.fetchall()
                
                results_object.append(self.pascal_rows_to_camel_dict_from_multi(cursor, result_rows))
                
                if not cursor.nextset():
                    break
                
            conn.commit()
        finally:
            conn.close()
            
        return results_object
        
        
    def execute_query_with_results_and_params(self, sql, params):
        sqlText = text("SET NOCOUNT ON;" + sql)
        
        conn = self.engine.raw_connection()
        try:
            cursor = conn.cursor()
            result = cursor.execute(sqlText, params)
            # result = conn.execution_options(stream_results=True).execute(sqlText)
            print(result)
            results_object = []
            
            while True:
                result_rows = cursor.fetchall()
                
                results_object.append(self.pascal_rows_to_camel_dict_from_multi(cursor, result_rows))
                
                if not cursor.nextset():
                    break
                
            conn.commit()
        finally:
            conn.close()
            
        return results_object